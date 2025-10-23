# US 2.2.5

## 1. Context

*Shipping agents are essential stakeholders in port operations, acting as intermediaries between shipping companies and the port authority. In order to grant them access to the port’s digital system, it is necessary to register their organizations and representatives.*

## 2. Requirements

**US 2.2.5** As a Port Authority Officer, I want to register new shipping agent organizations, so that they can operate within the port’s digital system.

**Acceptance Criteria:**

- Each organization must have at least an identifier, legal and alternative names, an address, its tax number.

- Each organization must include at least one representative at the time of registration.

- Representatives must be registered with name, citizen ID, nationality, email, and phone number. Email and phone number are used for system notifications, including approval decisions and the authentication process.

**Dependencies/References:**

*There are no dependencies with other US's.*

**Forum Insight:**

* No clarifications worth mention from the forum.


## 3. Analysis

Record Registration

![System Sequence Diagram ](images/system-sequence-diagram-US2.2.5.png)


## 4. C4 Model

#### Context - Level 1

![Context](/docs/Global_Artifacts/context_lvl1.png)

#### Containers - Level 2

![Containers](/docs/Global_Artifacts/containers_lvl2.png)

#### Components - Level 3

![Components](images/components_lvl3.png)

#### Code - Level 4

![Code](images/code_lvl4.png)


#### Level +1

##### Vessel Type POST
![nivel+1](images/code_lvl4+1_Post.png)

##### Vessel Type UPDATE
![nivel+1](images/code_lvl4+1_Update.png)

## 5. Integration Tests

### Tests Related to Post

```csharp
        [Theory]
        [InlineData("SA003", "Test1", "T1", "Test1 St", "TAX001")]
        [InlineData("SA004", "Test2", "T2", "Test2 St", "TAX002")]
        public async Task PostShippingAgentOrganization_CreatesSuccessfully(string code, string legalName, string alternativeName, string address, string taxNumber)
        {
            var newOrg = new ShippingAgentOrganizationWithRepresentativeDTO
            {
                Code = code,
                LegalName = legalName,
                AlternativeName = alternativeName,
                Address = address,
                TaxNumber = taxNumber,
                RepresentativeName = $"Rep1",
                RepresentativeCitizenId = $"REP123",
                RepresentativeNationality = "PT",
                RepresentativeEmail = $"rep@test.com",
                RepresentativePhoneNumber = "123456789"
            };

            var postResponse = await _client.PostAsJsonAsync($"/api/ShippingAgentOrganization", newOrg);
            Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/ShippingAgentOrganization/ByCode/{code}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

            var createdOrg = await postResponse.Content.ReadFromJsonAsync<ShippingAgentOrganizationWithRepresentativeDTO>();
            Assert.NotNull(createdOrg);
            Assert.Equal(code, createdOrg.Code);
            Assert.Equal(legalName, createdOrg.LegalName);
            Assert.Equal(alternativeName, createdOrg.AlternativeName);
            Assert.Equal(address, createdOrg.Address);
            Assert.Equal(taxNumber, createdOrg.TaxNumber);
        }


        [Theory]
        [InlineData("", "Valid Legal Name", "Valid Alt Name", "Valid Address", "VALIDTAX")] // Empty Code
        [InlineData("INVALID CODE!", "Valid Legal Name", "Valid Alt Name", "Valid Address", "VALIDTAX")] // Invalid Code with special characters
        [InlineData("VALIDCODE", "", "Valid Alt Name", "Valid Address", "VALIDTAX")] // Empty LegalName
        [InlineData("VALIDCODE", "Valid Legal Name", "", "Valid Address", "VALIDTAX")] // Empty AlternativeName
        [InlineData("VALIDCODE", "Valid Legal Name", "Valid Alt Name", "", "VALIDTAX")] // Empty Address
        [InlineData("VALIDCODE", "Valid Legal Name", "Valid Alt Name", "Valid Address", "")] // Empty TaxNumber
        public async Task PostShippingAgentOrganization_InvalidData_ReturnsBadRequest(string code, string legalName, string alternativeName, string address, string taxNumber)
        {
            var newOrg = new ShippingAgentOrganizationWithRepresentativeDTO
            {
                Code = code,
                LegalName = legalName,
                AlternativeName = alternativeName,
                Address = address,
                TaxNumber = taxNumber
            };

            var postResponse = await _client.PostAsJsonAsync($"/api/ShippingAgentOrganization", newOrg);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

```

### Tests Related to Update

```csharp
        [Theory]
        [InlineData("Test 1", "Test road 1", "789 tests", "TAX789012")]
        [InlineData("Test 2", "Test road 2", "321 tests", "TAX210987")]
        public async Task PutShippingAgentOrganization_UpdatesSuccessfully(string legalName, string alternativeName, string address, string taxNumber)
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization/ByCode/AAA1");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var org = await response.Content.ReadFromJsonAsync<ShippingAgentOrganizationDTO>();
            Assert.NotNull(org);

            org.LegalName = legalName;
            org.AlternativeName = alternativeName;
            org.Address = address;
            org.TaxNumber = taxNumber;

            var putResponse = await _client.PutAsJsonAsync($"/api/ShippingAgentOrganization/Update/{org.Id}", org);
            Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/ShippingAgentOrganization/ByID/{org.Id}");
            if (getResponse.StatusCode != HttpStatusCode.OK)
            {
                var errorContent = await getResponse.Content.ReadAsStringAsync();
                throw new Xunit.Sdk.XunitException($"Failed to retrieve updated organization. Status Code: {getResponse.StatusCode}, Content: {errorContent}");
            }
            var returnedOrg = await getResponse.Content.ReadFromJsonAsync<ShippingAgentOrganizationDTO>();
            Assert.NotNull(returnedOrg);
            Assert.Equal(legalName, returnedOrg.LegalName);
            Assert.Equal(alternativeName, returnedOrg.AlternativeName);
            Assert.Equal(address, returnedOrg.Address);
            Assert.Equal(taxNumber, returnedOrg.TaxNumber);
        }


                [Theory]
        [InlineData("", "TEST", "test", "999 New Address", "NEW123456")] // Empty Code
        [InlineData("INVALID CODE!", "Valid Legal Name", "test", "999 New Address", "NEW123456")] // Invalid Code with special characters
        [InlineData("VALIDCODE", "", "test", "999 New Address", "NEW123456")] // Empty LegalName
        [InlineData("VALIDCODE", "Valid Legal Name", "", "999 New Address", "NEW123456")] // Empty AlternativeName
        [InlineData("VALIDCODE", "Valid Legal Name", "test", "", "NEW123456")] // Empty Address
        [InlineData("VALIDCODE", "Valid Legal Name", "test", "999 New Address", "")] // Empty TaxNumber

        public async Task PutShippingAgentOrganization_InvalidData_ReturnsBadRequest(string? code, string? legalName, string? alternativeName, string? address, string? taxNumber)
        {
            var response = await _client.GetAsync($"/api/ShippingAgentOrganization/ByCode/AAA1");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var org = await response.Content.ReadFromJsonAsync<ShippingAgentOrganizationDTO>();
            Assert.NotNull(org);

            org.Code = code;
            org.LegalName = legalName;
            org.AlternativeName = alternativeName;
            org.Address = address;
            org.TaxNumber = taxNumber;

            var putResponse = await _client.PutAsJsonAsync($"/api/ShippingAgentOrganization/Update/{org.Id}", org);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }
```
