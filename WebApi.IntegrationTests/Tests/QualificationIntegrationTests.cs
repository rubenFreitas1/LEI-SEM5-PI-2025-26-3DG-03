using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Xunit;
using WebApi;
using Application.DTO;
using Microsoft.AspNetCore.Mvc.Testing;

using DataModel.Repository;
using WebApi.IntegrationTests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using System.Runtime.InteropServices;

namespace WebApi.IntegrationTests.Tests
{

    public class QualificationIntegrationTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public QualificationIntegrationTests(IntegrationTestsWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();
                Utilities.ReinitializeDbForTests(db);
            }
        }


        [Fact]
        public async Task GetAllQualifications_ReturnsOkAndList()
        {
            var response = await _client.GetAsync("/api/Qualification");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var qualifications = await response.Content.ReadFromJsonAsync<List<QualificationDTO>>();
            Assert.NotNull(qualifications);
            Assert.True(qualifications.Count >= 3);
        }

        [Theory]
        [InlineData("NONEXIST")]
        [InlineData("INVALID")]
        public async Task GetQualificationByCode_NotFound(string code)
        {
            var response = await _client.GetAsync($"/api/Qualification/ByCode/{code}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("QUAL1")]
        [InlineData("QUAL2")]
        [InlineData("QUAL3")]
        public async Task GetQualificationByCode_Found(string code)
        {
            var response = await _client.GetAsync($"/api/Qualification/ByCode/{code}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var qualification = await response.Content.ReadFromJsonAsync<QualificationDTO>();
            Assert.NotNull(qualification);
            Assert.Equal(code, qualification.Code);
        }

        [Theory]
        [InlineData("NonExisting Name")]
        [InlineData("Invalid Qualification")]
        public async Task GetQualificationByName_NotFound(string name)
        {
            var response = await _client.GetAsync($"/api/Qualification/ByName/{name}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("First Qualification")]
        [InlineData("Second Qualification")]
        [InlineData("Third Qualification")]
        public async Task GetQualificationByName_Found(string name)
        {
            var response = await _client.GetAsync($"/api/Qualification/ByName/{name}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var qualifications = await response.Content.ReadFromJsonAsync<List<QualificationDTO>>();
            Assert.NotNull(qualifications);
            Assert.NotEmpty(qualifications);
        }

        [Fact]
        public async Task PostQualification_ValidData_ReturnsCreatedAndOK()
        {
            var newQualification = new QualificationDTO
            {
                Code = "QUAL4",
                Name = "Fourth Qualification",
                Description = "Description for fourth qualification test"
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Qualification", newQualification);
            Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

            var createdQualification = await postResponse.Content.ReadFromJsonAsync<QualificationDTO>();
            Assert.NotNull(createdQualification);
            Assert.Equal(newQualification.Code, createdQualification.Code);
            Assert.Equal(newQualification.Name, createdQualification.Name);
            Assert.Equal(newQualification.Description, createdQualification.Description);


            var getResponse = await _client.GetAsync($"/api/Qualification/ByCode/{newQualification.Code}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        }

        [Theory]
        [InlineData("QUAL1", "Duplicate Code Test", "Valid description for duplicate code test")]
        [InlineData("QUAL2", "Another Duplicate", "Another valid description for duplicate code")]
        [InlineData("QUAL3", "Third Duplicate", "Third valid description for duplicate code")]
        public async Task PostQualification_DuplicateCode_ReturnsBadRequest(string code, string name, string description)
        {
            var duplicateQualification = new QualificationDTO
            {
                Code = code,
                Name = name,
                Description = description
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Qualification", duplicateQualification);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("NEWQUAL1", "First Qualification", "Valid description for duplicate name")]
        [InlineData("NEWQUAL2", "Second Qualification", "Another valid description for duplicate name")]
        [InlineData("NEWQUAL3", "Third Qualification", "Third valid description for duplicate name")]
        public async Task PostQualification_DuplicateName_ReturnsBadRequest(string code, string name, string description)
        {
            var duplicateQualification = new QualificationDTO
            {
                Code = code,
                Name = name,
                Description = description
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Qualification", duplicateQualification);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("", "Valid Name", "Valid description with two words")]
        [InlineData(null, "Valid Name", "Valid description with two words")]
        [InlineData("   ", "Valid Name", "Valid description with two words")]
        [InlineData("TOOLONGCODE123456", "Valid Name", "Valid description with two words")]
        [InlineData("CODE@#$", "Valid Name", "Valid description with two words")]
        public async Task PostQualification_InvalidCode_ReturnsBadRequest(string? code, string name, string description)
        {
            var invalidQualification = new QualificationDTO
            {
                Code = code,
                Name = name,
                Description = description
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Qualification", invalidQualification);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("VALID1", "", "Valid description with two words")]
        [InlineData("VALID2", null, "Valid description with two words")]
        [InlineData("VALID3", "   ", "Valid description with two words")]
        [InlineData("VALID4", "Invalid123", "Valid description with two words")]
        [InlineData("VALID5", "Invalid@Name", "Valid description with two words")]
        public async Task PostQualification_InvalidName_ReturnsBadRequest(string code, string? name, string description)
        {
            var invalidQualification = new QualificationDTO
            {
                Code = code,
                Name = name,
                Description = description
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Qualification", invalidQualification);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("VALID6", "Valid Name", "")]
        [InlineData("VALID7", "Valid Name", null)]
        [InlineData("VALID8", "Valid Name", "   ")]
        [InlineData("VALID9", "Valid Name", "OneWord")]
        [InlineData("VALID10", "Valid Name", "This is a very long description that exceeds the maximum allowed length of 150 characters for qualification descriptions and should therefore be rejected by the validation logic in the domain model because it is too long to be stored properly in the system database")] // > 150 chars
        public async Task PostQualification_InvalidDescription_ReturnsBadRequest(string code, string name, string? description)
        {
            var invalidQualification = new QualificationDTO
            {
                Code = code,
                Name = name,
                Description = description
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Qualification", invalidQualification);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("Fifth Qualification", "Updated Description with multiple words")]
        [InlineData("Sixth Qualification", "Another updated description with words")]
        public async Task PutQualification_UpdatesSuccessfully(string name, string description)
        {
            var response = await _client.GetAsync("/api/Qualification/ByCode/QUAL1");
            var qualification = await response.Content.ReadFromJsonAsync<QualificationDTO>();
            Assert.NotNull(qualification);
            Assert.Equal("QUAL1", qualification.Code);


            qualification.Name = name;
            qualification.Description = description;

            var putResponse = await _client.PutAsJsonAsync($"/api/Qualification/Update/{qualification.Id}", qualification);
            Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);


            var getResponse = await _client.GetAsync($"/api/Qualification/ByCode/{qualification.Code}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
            var updatedQualification = await getResponse.Content.ReadFromJsonAsync<QualificationDTO>();
            Assert.NotNull(updatedQualification);
            Assert.Equal(name, updatedQualification.Name);
            Assert.Equal(description, updatedQualification.Description);
        }

        [Theory]
        [InlineData("Second Qualification")]
        [InlineData("Third Qualification")]
        public async Task PutQualification_DuplicateName_ReturnsBadRequest(string duplicateName)
        {

            var response = await _client.GetAsync("/api/Qualification/ByCode/QUAL1");
            var qualification = await response.Content.ReadFromJsonAsync<QualificationDTO>();
            Assert.NotNull(qualification);
            Assert.Equal("QUAL1", qualification.Code);
            Assert.Equal("First Qualification", qualification.Name);


            qualification.Name = duplicateName;
            qualification.Description = "Updated description with words";

            var putResponse = await _client.PutAsJsonAsync($"/api/Qualification/Update/{qualification.Id}", qualification);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }



        [Theory]
        [InlineData(null, "Valid Description with words")]
        [InlineData("", "Valid Description with words")]
        [InlineData("   ", "Valid Description with words")]
        public async Task PutQualification_NullOrEmptyName_IgnoresUpdate(string? name, string description)
        {

            var response = await _client.GetAsync("/api/Qualification/ByCode/QUAL2");
            var qualification = await response.Content.ReadFromJsonAsync<QualificationDTO>();
            Assert.NotNull(qualification);
            Assert.Equal("QUAL2", qualification.Code);
            var originalName = qualification.Name;

            qualification.Name = name;
            qualification.Description = description;

            var putResponse = await _client.PutAsJsonAsync($"/api/Qualification/Update/{qualification.Id}", qualification);
            Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);


            var getResponse = await _client.GetAsync($"/api/Qualification/ByCode/QUAL2");
            var updatedQualification = await getResponse.Content.ReadFromJsonAsync<QualificationDTO>();
            Assert.NotNull(updatedQualification);
            Assert.Equal(originalName, updatedQualification.Name);
            Assert.Equal(description, updatedQualification.Description);
        }

        [Theory]
        [InlineData("Updated Name", null)]
        [InlineData("Updated Name Two", "")]
        [InlineData("Updated Name Three", "   ")]
        public async Task PutQualification_NullOrEmptyDescription_IgnoresUpdate(string name, string? description)
        {

            var response = await _client.GetAsync("/api/Qualification/ByCode/QUAL3");
            var qualification = await response.Content.ReadFromJsonAsync<QualificationDTO>();
            Assert.NotNull(qualification);
            Assert.Equal("QUAL3", qualification.Code);
            var originalDescription = qualification.Description;

            qualification.Name = name;
            qualification.Description = description;

            var putResponse = await _client.PutAsJsonAsync($"/api/Qualification/Update/{qualification.Id}", qualification);
            Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);


            var getResponse = await _client.GetAsync($"/api/Qualification/ByCode/QUAL3");
            var updatedQualification = await getResponse.Content.ReadFromJsonAsync<QualificationDTO>();
            Assert.NotNull(updatedQualification);
            Assert.Equal(name, updatedQualification.Name);
            Assert.Equal(originalDescription, updatedQualification.Description);
        }

        [Theory]
        [InlineData("Invalid Name 123", "Valid description but invalid name")]
        [InlineData("Valid Name", "OnlyOneWord")]
        [InlineData("Invalid@Name", "Valid description with multiple words")]
        public async Task PutQualification_InvalidData_ReturnsBadRequest(string name, string description)
        {

            var response = await _client.GetAsync("/api/Qualification/ByCode/QUAL1");
            var qualification = await response.Content.ReadFromJsonAsync<QualificationDTO>();
            Assert.NotNull(qualification);
            Assert.Equal("QUAL1", qualification.Code);

            qualification.Name = name;
            qualification.Description = description;

            var putResponse = await _client.PutAsJsonAsync($"/api/Qualification/Update/{qualification.Id}", qualification);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }


    }
}