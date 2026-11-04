# Secure Vibe Coding — 3 skills para o evento

Este pacote contém **três skills genéricas** em inglês, cada uma com uma função específica. Elas foram adaptadas das duas instruções originais enviadas para revisão, mas retiram nomes de projetos, referências pessoais e detalhes de infraestrutura privada. Os arquivos estão prontos para importação manual em agentes que aceitem `SKILL.md`; o local de instalação depende da ferramenta de IA.

**1. `secure-planner`: antes de escrever código.** Ajuda a transformar uma ideia em arquitetura simples, limites de confiança, regras de acesso, riscos, requisitos mensuráveis e testes negativos que o agente de programação precisará implementar.

**2. `security-reviewer`: depois que o código existe.** Faz revisão independente e somente leitura de código/configurações, classifica achados por evidência, aponta lacunas e registra a cobertura real da auditoria. Não corrige, não faz deploy e não cria issues automaticamente.

**3. `security-tester`: para testar a aplicação.** Define uma matriz de testes de segurança, executa testes autorizados em ambientes locais e isolados e pode orquestrar scanners locais previamente instalados. Inclui orientações para Gitleaks, Semgrep, OSV-Scanner e OWASP ZAP (este último somente de forma separada e expressamente autorizada).

## Como demonstrar no workshop

Imagine uma aplicação com dois usuários e tarefas privadas. O planejador define que nenhum usuário pode ler tarefas do outro. O revisor verifica se o código aplica isso no servidor. O testador executa o teste negativo, utilizando somente contas e dados sintéticos, e registra o resultado. O mesmo processo pode ser repetido para segredos, dependências e riscos de aplicações com IA.

## Idioma do relatório — escolha do usuário

**As três skills perguntam ao usuário em qual idioma ele prefere receber o relatório antes de gerar o resultado final**, a menos que ele já tenha informado isso na mesma tarefa. Exemplos: português do Brasil, inglês dos EUA, espanhol, alemão ou outro. Não existe idioma obrigatório: mesmo que o pacote de instruções esteja escrito em inglês, o relatório pode sair no idioma escolhido. Sem resposta, o agente deve marcar `REPORT_LANGUAGE_PENDING` e não adivinhar. Nomes de comandos, IDs, chaves JSON e códigos de status técnicos não são traduzidos. A escolha do idioma não concede autorização para testes ou scans.

## Avisos importantes

- Uma skill é um conjunto de **instruções**, não um sistema de permissões e nem uma certificação.
- Nenhuma ferramenta será instalada automaticamente; os scanners precisam existir e ser confiáveis.
- Evite executar testes contra produção, serviços de terceiros ou ambientes contendo dados pessoais.
- A execução de scanners e o uso da rede devem ser isolados/controlados **fora** do prompt.
- **`NO MATCHES OBSERVED` não significa aplicação segura.** Achados dos scanners exigem interpretação; verificações não executadas devem aparecer como `NOT RUN`.
- Incluí um pequeno executor opcional em Python para Gitleaks, Semgrep e OSV e três testes simulados para verificar como ele lida com saídas sensíveis e autorizações. Ele não automatiza o OWASP ZAP.
- O repositório AI-Sec inclui uma licença MIT na raiz. Confira se ela atende ao uso pretendido antes de redistribuir.
