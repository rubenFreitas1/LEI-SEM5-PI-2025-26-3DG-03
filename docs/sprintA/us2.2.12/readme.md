# US 2.2.12

## 1. Context

This user story addresses the need for logistics operators to register and manage physical resources essential for vessel and yard operations. Resources include cranes (fixed and mobile), trucks, and other equipment, each requiring unique identification, operational capacity details, and assignment to specific areas. The system must support creating, updating, and deactivating resources, ensuring that data is preserved for audit and planning purposes. Resources must be searchable and filterable by various attributes, and qualification requirements must be recorded to ensure only certified staff can operate them. While this story focuses on resource management, staff-resource pairing will be addressed in future user stories. Dependencies include US2.2.13 for qualification management.

## 2. Requirements

**US 2.2.12**  As a Logistics Operator, I want to register and manage physical
resources (create, update, deactivate)

**Acceptamce Criteria:**

- Resources include cranes (Fixed and mobile), trucks, and other equipment directly involved in vessel and yard operations.

- Each resource must have a unique alpha-numeric code and a description.

- Each resource must store its operational capacity, which varies according to the kind of resource, and, if any, the assigned area(e.g., Dock A, Yard B).

- Additional properties must include:
    - Current availability status (active m inactive, under maintenance).
    - Setup time (in minutes), if relevant, before starting operations.
    - (Staff) Qualification requirements, ensuring only properly certified staff can be scheduled with the resource.
- Deactivation/reactivation must not delete resource data but preserve it for audit and historical planning purposes.
- Resources must be searchable and filterable by code, description, kind of resource, status.

**Dependencies/References:**

*This US depends on US2.2.13 that is focused on the creation of Qualifications.*

**Forum Insight:**

>[Question] - Boa tarde,
"The system must therefore ensure that each resource (e.g., a crane or a truck) is matched with the required (number of) qualified staff members whose availability overlaps with the resource’s operational window."
É possível existir um membro da equipa que opera mais de um recurso? Por exemplo, temos um camião com uma janela operacional entre 8:00-15:00, e está pareado com um membro que tem a janela operacional entre 8:00-20:00. Esse membro pode também operar outro recurso no resto da sua janela, caso tenha qualificações?
>
>[Answer] - ATENÇÃO: nas US 2.2.11 e US 2.2.12 não estamos a atribuir/emparelhar staff com recursos físicos.
Estamos apenas a registar informação sobre cada elemento do staff logístico e quais são os recursos físicos existentes.
Mais tarde, no âmbito de outras US, teremos que explorar esta informação para concluir, por exemplo, que é necessário que uma grua seja operada por uma dada pessoa das 8h00 às 11h30 e por outra das 12h00 às 14h00. O staff pode operar qualquer recurso desde que possua as qualificações necessárias para o efeito.
Ao não compreender esta diferença, a probabilidade de fazerem asneira é grande! Muito cuidado.

## 3. Analysis

Physical Resources Creation

![System Sequence Diagram](images/system-sequence-diagram-US2.2.12-creation.png)

Physical Resources Management

![System Sequence Diagram](images/system-sequence-diagram-US2.2.12-manage.png)


## Forum
https://moodle.isep.ipp.pt/mod/forum/discuss.php?d=1333
https://moodle.isep.ipp.pt/mod/forum/discuss.php?d=1303
https://moodle.isep.ipp.pt/mod/forum/discuss.php?d=1051
https://moodle.isep.ipp.pt/mod/forum/discuss.php?d=1110
https://moodle.isep.ipp.pt/mod/forum/discuss.php?d=1094
https://moodle.isep.ipp.pt/mod/forum/discuss.php?d=1075
https://moodle.isep.ipp.pt/mod/forum/discuss.php?d=1048
https://moodle.isep.ipp.pt/mod/forum/discuss.php?d=813