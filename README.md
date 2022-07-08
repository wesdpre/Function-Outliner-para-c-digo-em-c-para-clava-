# Function-Outliner-para-c-digo-em-c-para-clava-

Execução 

Para executar é necessário primeiro no código c acrescentar estes dois pedações de código “#pragma outliner start” e” #pragma outliner end” (ou acrescentar a AST os nós relacionados), com o intuito de indicam o início e o fim do código que pretendemos retirar e substituir por uma função. Em segundo criar a classe FunctionOutliner() e chamar a função outliner() que dará inicio ao inteiro processo, esta deve ser chamada com um atributo string que é o nome da função que espera-se criar.

O Function Outliner pode executar em default mas também tem a capacidade de executar com opções de execução (não ainda todas implementadas) estas necessitam de que os nós lidos pelo outliner tenham nos dados pelo menos um objeto com o nome outlinerName outlinerMode. As opções são de:


- Atribuir um nome no caso em que outlinerName exista e contenha um nome aceite (este é substitui se a função outliner() tem o atributo para o nome)
- O outlinerMode contem “-a” em vez de o processo de transferência de nós ser realizado é efetuada uma ejeção de código diretamente.
- O outlinerMode contem “-b” (opção ainda não introduzida) transforma todos os usos de variáveis em uso de apontadores e transportar todas as declarações de variáveis para o exterior da função, poderá permitir o uso da function outliner em casos previamente seria incapaz.

