
/*
 * Outliner Mode ::
 * 	-a : trasferir apartir de copia de codigo  
 * 	-b : eliminar e passa-las para fora do código as vardecl, 
 * e transformar todos os usos de variáveis em apontadores (nao implementada)
*/
laraImport("weaver.Query");
laraImport( "clava.ClavaJoinPoints");


class FunctionOutliner{
	
	outliner( name, mode ) {
	
		var $pragma_Array = Query.search("pragma", {name: "outliner", content: "start"});
		var $stmts = [];
		
		for(var $pragma of $pragma_Array){
			// find code to perform outliner
			this.findNextOutliner($stmts, $pragma);
			if($stmts.length != 0){
				
				//Confirm that the name is valid
				//if the name is undefined then it will get the value of the outlinerName variable of the first node
				name ??= $stmts[0].data.outlinerName;
				
				//validate name
				if(!this.isValidName(name)){
					throw "Outliner Error 3 :: invalid name ("+name+"). \nThe name must be a word, ie a non-null string with no spaces.";
					return -1;	
				}
			
				//Confirm that the mode is valid
				//if the mode is undefined then it will get the value of the outlinerMode variable of the first node
				mode ??= $stmts[0].data.outlinerMode;
				//validate mode
				var modeId = -2;
				if( (modeId = this.isValidMode(mode)) < 0 ){
					throw "Outliner Error 4 :: invalid mode ("+mode+"). \nThe mode must be null, -a , -b or -a-b";
					return -1;	
				}
	
				//perform outliner
				this.creatOutliner($stmts, name, modeId);
				var $stmts = [];
			}	
		}		
	}

	findNextOutliner($stmts, $pragma) {
		var foundEnd = false;
		
		for(var $stmt of $pragma.ancestor("statement").siblingsRight) {
			if($stmt.instanceOf("wrapperStmt") && $stmt.kind === "pragma" && $stmt.content.name === "outliner" && $stmt.content.content === "end") {
				foundEnd = true;
				break;
			}		
			$stmts.push($stmt);
		}
	
		if(!foundEnd) {
			throw "Outliner Error 1 :: Found starting pragma but not ending pragma";
			return -1;
		} 
		
		if($stmts.length == 0){
			throw "Outliner Error 2 :: Found pragma ERROR information size 0";
			return -2;
		}	
		return 0;
	}
	
	isValidName( name ){
		if (name == null)return false;
		if( !((name.compareTo("")==0) || (name.compareTo("undefined")==0)) ){
			const word = name.split(' ');
			if(! (word.filter(word => word !== '').length > 1) ){
				println("is Valid word::"+ true);
				return true;
			}
		}
		return false;
	}

	isValidMode( mode ){
		if (mode == null)return 0;
		if( (mode.compareTo("")==0) || (mode.compareTo("undefined")==0)){
			return 0;  //mode default
		}
		
		var modeId = 0; 		
		const modes = mode.split(' ');
		if(modes.filter(modes => modes !== ' ').length > 1){
			for( var m of modes.filter(modes => modes !== '') ){
				var mId = this.isValidMode(m);
				if(mId < 0){
					return -1;
				}
				modeId += mId;
			}
		}
		
		if(mode.compareTo("-a")==0){
			modeId += 1;
		return modeId;
		}

		if(mode.compareTo("-b")==0){
			modeId += 10;
		return modeId;
		}
		if(modeId == 0){
			return -1;
		}
		return modeId;
	}
	
	creatOutliner($stmts, name, modeId){
		const $firstStmt = $stmts[0];
		const $file = $firstStmt.ancestor("file");
		const $firstFunction = $file.firstJp("function");
		const $varref_param_array = this.notSaveVarref($stmts);
		const $parameters_array = this.parametersOutliner($varref_param_array);
		const $returnType = ClavaJoinPoints.builtinType("void");

		if (modeId%10 == 0){
			var $outlinedFunction = ClavaJoinPoints.functionDecl(name, $returnType, $parameters_array);
			// copy function
			var $outlinedScope = ClavaJoinPoints.scope($stmts);
			$outlinedFunction.setBody($outlinedScope);
			
			//call function and eliminate statements
			var $testParenthesis =[];
			for(var $varref_param of $varref_param_array){
				$testParenthesis.push( ClavaJoinPoints.exprLiteral($varref_param.vardecl.name) );
			}
			
			var $outlinedCall = ClavaJoinPoints.call( $outlinedFunction,$testParenthesis );
			$firstStmt.replaceWith($outlinedCall);
			for(var $stmt of $stmts) {
				$stmt.detach();
			}
			
			$firstFunction.insertBefore($outlinedFunction);
			return ;
		}
 		
 		var callFunction = name+"("+ this.callParametersOutlinerA( $parameters_array, modeId ) + ");";
 		var declareFunction = $returnType.code+" "+name+"("+ this.parametersOutlinerA( $parameters_array, modeId ) + ")";
 			
		// copy function
		var str = "{\n";
		for(var $stmt of $stmts) {
			str += "\n"+$stmt.code;
		}
		str += "\treturn ;\n}\n";
			
		$firstFunction.insertBefore(declareFunction + str);

		//call function and eliminate statements
		$firstStmt.replaceWith(callFunction);
		for(var $stmt of $stmts) {
			$stmt.detach();
		}
		return;
	}
	
	notSaveVarref($stmts){
		var $varref_stmsts_Array = [];
		var $vardecl_stmsts_Array = [];
		
 		for(var $siblingStmt of $stmts){
			$varref_stmsts_Array = $varref_stmsts_Array.concat( Query.searchFrom($siblingStmt, "varref").get());
			const vardeclIds = Query.searchFrom($siblingStmt,"vardecl").get().map(node => node.astId);
			$vardecl_stmsts_Array = $vardecl_stmsts_Array.concat(vardeclIds);
		}

		var $notSVarref_array = []
		for(var $varref_stmsts of $varref_stmsts_Array){	
			if( $vardecl_stmsts_Array.indexOf( $varref_stmsts.decl.astId ) < 0){
				if(! this.existNameInArray($notSVarref_array,$varref_stmsts.name)){
					$notSVarref_array.push($varref_stmsts);
				}
			}
		}
		return  $notSVarref_array;
	} 

	callParametersOutlinerA($parameters_array, modeId){
		var str = "";
		var i = 0;
		for(;i < $parameters_array.length  -1; i++){
			str += $parameters_array[i].name+", ";
		}
		if( $parameters_array.length  > 0 ){
			str += $parameters_array[i].name;	
		}
		return str;
	}

	existNameInArray( $array ,m ){
		var resolt = false;
		for(var $element of $array){	
			if($element.name.normalize() === m.normalize()){
				return true;
			}
		}
		return resolt;
	}

	parametersOutliner($parameters_array_varref, modeId){
		var parameters_array = [];
		
		for(var param_next of $parameters_array_varref){
			parameters_array.push( ClavaJoinPoints.param(param_next.name, param_next.Type) );
		}
		
		return parameters_array;
	}
			
	parametersOutlinerA( $parameters_array, modeId){
		var str = "";
		var i = 0;
		for(;i < $parameters_array.length  -1; i++){
			str += $parameters_array[i].code+", ";
		}
		if( $parameters_array.length  > 0 ){
			str += $parameters_array[i].code;	
		}	
		return str;
	}
}