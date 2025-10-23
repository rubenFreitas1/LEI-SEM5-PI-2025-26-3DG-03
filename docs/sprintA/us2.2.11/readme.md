# US 2.2.11

## 1. Context

*Since many resources cannot function autonomously, the system must incorporate operating staff management information to support realistic scheduling and allocation. 
Despite their identification and contact data such as the mecanographic number, short name, email and phone, it is necessary to capture: Operations Window, Qualification, Current Status.*

## 2. Requirements

**US 2.2.11** As a Logistics Operator, I want to register and manage operating staff members (create, update, deactivate), so that the system can accurately reflect staff availability and ensure that only qualified personnel are assigned to resources during scheduling.

**Acceptance Criteria:**

- Each staff member must have a unique mecanographic number (ID), short name, contact details (email, phone),  qualifications, operational window, and current status (e.g., available, unavailable).

- Deactivation/reactivation must not delete staff data but preserve it for audit and historical planning purposes.

- Staff members must be searchable and filterable by id, name, status, and qualifications.

- To update or deactivate a staff member the system must guarantee a staff member is already registered in the system

**Dependencies/References:**

*There is no dependencies associated to this US.*

**Forum Insight:**

>> In US 2.2.11, the process of updating a staff member is mentioned. With the introduction of this action, a few questions have arisen:
When updating a staff member, can all previously entered information be modified?
Is it possible to leave a staff member’s record incomplete — for example, register some information now and complete the rest later — given that this could occur with the update action?
When a staff member is registered, do they automatically become available (with the status "available" )?
> 
> The mecanographic number cannot be modified. Everything else might be modified.
When registering a staff member, (s)he must be, by default, available.
Mandatory information comprehends, the mecanographic number , short name, contacts and status.

>>Just to clarify, if some information (outside the mandatory) is missing at registration because it will be provided later, should the staff member be marked as "available" or "unavailable"?
>
>The user - logistic operator - may choose.
Notice that, for instance, if the operational window is not specified, latter (on another US) the system will not be able to assign task to this staff member.

>>Como é que nós representamos a operational window? Ou seja, Temos uma disponibilidade do trabalhador e os turnos são calculados daí, ou temos os turnos já definidos que os trabalhadores fazem, e a operational window é logo calculada a partir daí?
>
>Bem, há diferentes formas (técnicas) de representação. Adotem a que for mais interessante...
Exemplos da informação a capturar pode ajudar à decisão.
Exemplo 1:\
. 2º feira: das 7h00 às 10h00; das 10h30 às 13h30; das 15h00 às 18h00;\
. 3º feira: das 7h00 às 10h00; das 10h30 às 13h30; das 15h00 às 18h00;\
. 4º feira: das 09h30 às 12h30; das 14h00 às 17h00;\
. 5º feira: das 14h00 às 17h00; das 17h30 às 20h30;\
. 6º feira: das 14h00 às 17h00; das 17h30 às 20h30;\
. Sábado: das 09h30 às 12h30;\
. Domingo: n/d;\
Exemplo 2:\
. 2º feira: das 13h00 às 17h00; das 18h00 às 21h00;\
. 3º feira: das 13h00 às 17h00; das 18h00 às 21h00;\
. 4º feira: n/d;\
. 5º feira: das 13h00 às 17h00; das 18h00 às 21h00;\
. 6º feira: das 13h00 às 17h00; das 18h00 às 21h00;\
. Sábado: das 13h00 às 17h00; das 18h00 às 21h00;\
. Domingo: n/d;\


## 3. Analysis

Record Registration

![System Sequence Diagram ](images/system-sequence-diagram-US2.2.11.png)

Record Update

![System Sequence Diagram ](images/system-sequence-diagram-US2.2.11(1).png)

Record Deactivation

![System Sequence Diagram ](images/system-sequence-diagram-US2.2.11(2).png)

## 4. C4 Model

#### Context - Level 1

![Context](/docs/Global_Artifacts/context_lvl1.png)

#### Containers - Level 2

![Containers](/docs/Global_Artifacts/containers_lvl2.png)

#### Components - Level 3

![Components](images/code_lvl3.png)

#### Code - Level 4

![Code](images/code_lvl4.png)

#### Level +1

Qualification POST
![nivel+1](images/code_+1_Post.png)

Qualification UPDATE
![nivel+1](images/code_+1_Put.png)

## 5. Integration Tests

### Tests Related To Post

```csharp
        [Fact]
        public async Task PostStaff_ThenGetByName_ReturnsCreatedAndOk()
        {
            var dto = new StaffDTO
            {
                Name = "TestName",
                QualificationCodes = new List<string> { "QUAL1", "QUAL2" },
                Email = "stafftest@gmail.com",
                Phone = "987654333",
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "09:00",
                    EndTime = "17:00"
                },
                Status = ResourceStatus.Available
            };
            var postResponse = await _client.PostAsJsonAsync("/api/Staff", dto);
            Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/Staff/ByName/{dto.Name}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
            var returned = await getResponse.Content.ReadFromJsonAsync<StaffDTO>();
            Assert.NotNull(returned);
            Assert.Equal(dto.Name, returned.Name);
        }

        [Theory]
        [InlineData("staff1@gmail.com")]
        [InlineData("staff2@gmail.com")]
        public async Task PostStaff_DuplicateEmail_ReturnsConflict(string email)
        {
            var dto = new StaffDTO
            {
                Name = "TestName",
                QualificationCodes = new List<string> { "QUAL1", "QUAL2" },
                Email = email,
                Phone = "987654333",
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "09:00",
                    EndTime = "17:00"
                },
                Status = ResourceStatus.Available
            };
            var postResponse1 = await _client.PostAsJsonAsync("/api/Staff", dto);
            Assert.Equal(HttpStatusCode.Conflict, postResponse1.StatusCode);
        }

        [Theory]
        [InlineData("987654321")]
        [InlineData("987654322")]
        public async Task PostStaff_DuplicatePhone_ReturnsConflict(string phone)
        {
            var dto = new StaffDTO
            {
                Name = "TestName",
                QualificationCodes = new List<string> { "QUAL1", "QUAL2" },
                Email = "testemail@gmail.com",
                Phone = phone,
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "09:00",
                    EndTime = "17:00"
                },
                Status = ResourceStatus.Available
            };
            var postResponse1 = await _client.PostAsJsonAsync("/api/Staff", dto);
            Assert.Equal(HttpStatusCode.Conflict, postResponse1.StatusCode);
        }

        [Theory]
        [InlineData("9:00")]
        [InlineData("09-00")]
        [InlineData("25:00")]
        [InlineData("12:60")]
        [InlineData("abc")]
        [InlineData("")]
        public async Task PostStaff_InvalidTimeFormat_ReturnsBadRequest(string startTime)
        {
            var dto = new StaffDTO
            {
                Name = "TestName",
                QualificationCodes = new List<string> { "QUAL1", "QUAL2" },
                Email = "validemail@gmail.com",
                Phone = "987654333",
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = startTime,
                    EndTime = "17:00"
                },
                Status = ResourceStatus.Available
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Staff", dto);

            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);

            var error = await postResponse.Content.ReadAsStringAsync();
            Assert.Contains("invalid time", error, StringComparison.OrdinalIgnoreCase);
        }
```

### Tests Related To Put

```csharp
[Theory]
        [InlineData("Updated Staff One", new[] { "QUAL1" }, "staff1updated@gmail.com", "987654329", ResourceStatus.Available)]
        [InlineData("Updated Staff Two", new[] { "QUAL2" }, "staff2updated@gmail.com", "987654330", ResourceStatus.Unavailable)]
        public async Task PutStaff_UpdatesSuccessfully(string name, string[] qualificationCodes, string email, string phone, ResourceStatus status)
        {
            var response = await _client.GetAsync("/api/Staff");
            response.EnsureSuccessStatusCode();
            var staffs = await response.Content.ReadFromJsonAsync<List<StaffDTO>>();
            Assert.NotNull(staffs);
            var staff = staffs!.FirstOrDefault(s => s.Email == "staff1@gmail.com");
            Assert.NotNull(staff);

            staff.Name = name;
            staff.Email = email;
            staff.Phone = phone;
            staff.Status = status;
            staff.QualificationCodes = qualificationCodes;

            var putResponse = await _client.PutAsJsonAsync($"/api/Staff/Update/{staff.Id}", staff);
            Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

            var getResponse = await _client.GetAsync("/api/Staff");
            getResponse.EnsureSuccessStatusCode();
            var updatedList = await getResponse.Content.ReadFromJsonAsync<List<StaffDTO>>();
            var returned = updatedList!.FirstOrDefault(s => s.Email == email);
            Assert.NotNull(returned);
            Assert.Equal(name, returned.Name);
            Assert.Equal(email, returned.Email);
            Assert.Equal(phone, returned.Phone);
            Assert.Equal(status, returned.Status);
            Assert.Equal(qualificationCodes, returned.QualificationCodes);
        }

        [Fact]
        public async Task PutStaff_NotExisting_ReturnsNotFound()
        {
            var dto = new StaffDTO
            {
                Id = 99999,
                Name = "NonExistent",
                Email = "nonexistent@gmail.com",
                Phone = "987654336",
                QualificationCodes = new List<string> { "QUAL1" },
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "09:00",
                    EndTime = "17:00"
                },
                Status = ResourceStatus.Available
            };

            var putResponse = await _client.PutAsJsonAsync($"/api/Staff/Update/{dto.Id}", dto);
            Assert.Equal(HttpStatusCode.NotFound, putResponse.StatusCode);
        }

        [Fact]
        public async Task PutStaff_UpdatePartialFields_Succeeds()
        {
            var response = await _client.GetAsync("/api/Staff");
            response.EnsureSuccessStatusCode();
            var staffs = await response.Content.ReadFromJsonAsync<List<StaffDTO>>();
            var staff = staffs!.First();
            Assert.NotNull(staff);

            var originalEmail = staff.Email;
            var originalPhone = staff.Phone;

            staff.Name = "Partially Updated Name";
            staff.Status = ResourceStatus.Unavailable;

            var putResponse = await _client.PutAsJsonAsync($"/api/Staff/Update/{staff.Id}", staff);
            Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/Staff/ByID/{staff.Id}");
            var updatedStaff = await getResponse.Content.ReadFromJsonAsync<StaffDTO>();
            Assert.NotNull(updatedStaff);
            Assert.Equal("Partially Updated Name", updatedStaff!.Name);
            Assert.Equal(ResourceStatus.Unavailable, updatedStaff.Status);

            Assert.Equal(originalEmail, updatedStaff.Email);
            Assert.Equal(originalPhone, updatedStaff.Phone);
        }
```

