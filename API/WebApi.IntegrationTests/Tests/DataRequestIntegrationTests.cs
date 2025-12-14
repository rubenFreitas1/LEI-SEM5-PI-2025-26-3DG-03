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
using Domain.Model;
using System.ComponentModel.DataAnnotations;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace WebApi.IntegrationTests.Tests
{
    public class DataRequestIntegrationTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
        };

        public DataRequestIntegrationTests(IntegrationTestsWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();

            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();
                Utilities.ReinitializeDbForTests(db);
            }
        }


        [Fact]
        public async Task GetAllDataRequests_ReturnsOkAndContainsSeedData()
        {
            var response = await _client.GetAsync("/api/DataRequest");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var dataRequests = await response.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.NotNull(dataRequests);
            Assert.NotEmpty(dataRequests);
            
            Assert.Contains(dataRequests, dr => dr.SystemUserEmail == "admin.teste@example.com");
            Assert.Contains(dataRequests, dr => dr.SystemUserEmail == "operator.teste@example.com");
            Assert.Contains(dataRequests, dr => dr.SystemUserEmail == "portofficer.teste@example.com");
        }

        [Fact]
        public async Task GetAllDataRequests_ReturnsCorrectCount()
        {
            var response = await _client.GetAsync("/api/DataRequest");

            response.EnsureSuccessStatusCode();
            var dataRequests = await response.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            
            Assert.NotNull(dataRequests);
            Assert.Equal(3, dataRequests.Count); // Based on seeded data
        }



        [Fact]
        public async Task GetDataRequestById_WithValidId_ReturnsOk()
        {
            var allResponse = await _client.GetAsync("/api/DataRequest");
            allResponse.EnsureSuccessStatusCode();
            var dataRequests = await allResponse.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.NotNull(dataRequests);
            Assert.NotEmpty(dataRequests);

            var validId = dataRequests[0].Id;

            var response = await _client.GetAsync($"/api/DataRequest/ByID/{validId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var dataRequest = await response.Content.ReadFromJsonAsync<DataRequestDTO>(_jsonOptions);
            Assert.NotNull(dataRequest);
            Assert.Equal(validId, dataRequest.Id);
        }

        [Fact]
        public async Task GetDataRequestById_WithInvalidId_ReturnsNotFound()
        {
            var response = await _client.GetAsync("/api/DataRequest/ByID/999999");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetDataRequestById_VerifiesAllSeedDataRetrievable()
        {
            var allResponse = await _client.GetAsync("/api/DataRequest");
            allResponse.EnsureSuccessStatusCode();
            var dataRequests = await allResponse.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);

            foreach (var dr in dataRequests!)
            {
                var response = await _client.GetAsync($"/api/DataRequest/ByID/{dr.Id}");
                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
                
                var retrieved = await response.Content.ReadFromJsonAsync<DataRequestDTO>(_jsonOptions);
                Assert.NotNull(retrieved);
                Assert.Equal(dr.Id, retrieved.Id);
                Assert.Equal(dr.SystemUserEmail, retrieved.SystemUserEmail);
                Assert.Equal(dr.RequestType, retrieved.RequestType);
                Assert.Equal(dr.Status, retrieved.Status);
            }
        }


        [Fact]
        public async Task GetDataRequestsByEmail_WithExistingEmail_ReturnsOkAndCorrectData()
        {
            var response = await _client.GetAsync("/api/DataRequest/ByEmail/admin.teste@example.com");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var dataRequests = await response.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.NotNull(dataRequests);
            Assert.NotEmpty(dataRequests);
            Assert.All(dataRequests, dr => Assert.Equal("admin.teste@example.com", dr.SystemUserEmail));
            Assert.Contains(dataRequests, dr => dr.RequestType == DataRequestType.Access);
        }

        [Fact]
        public async Task GetDataRequestsByEmail_WithNonExistingEmail_ReturnsEmptyList()
        {
            var response = await _client.GetAsync("/api/DataRequest/ByEmail/nonexistent@example.com");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var dataRequests = await response.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.NotNull(dataRequests);
            Assert.Empty(dataRequests);
        }

        [Theory]
        [InlineData("admin.teste@example.com")]
        [InlineData("operator.teste@example.com")]
        [InlineData("portofficer.teste@example.com")]
        public async Task GetDataRequestsByEmail_WithDifferentSeededEmails_ReturnsCorrectData(string email)
        {
            var response = await _client.GetAsync($"/api/DataRequest/ByEmail/{email}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var dataRequests = await response.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.NotNull(dataRequests);
            Assert.NotEmpty(dataRequests);
            Assert.All(dataRequests, dr => Assert.Equal(email, dr.SystemUserEmail));
        }


        [Theory]
        [InlineData(DataRequestType.Access)]
        [InlineData(DataRequestType.Deletion)]
        [InlineData(DataRequestType.Rectification)]
        public async Task GetDataRequestsByType_WithValidType_ReturnsOkAndCorrectData(DataRequestType requestType)
        {
            var response = await _client.GetAsync($"/api/DataRequest/ByType/{requestType}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var dataRequests = await response.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.NotNull(dataRequests);
            
            if (dataRequests.Any())
            {
                Assert.All(dataRequests, dr => Assert.Equal(requestType, dr.RequestType));
            }
        }

        [Fact]
        public async Task GetDataRequestsByType_Access_ReturnsCorrectSeededData()
        {
            var response = await _client.GetAsync($"/api/DataRequest/ByType/{DataRequestType.Access}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var dataRequests = await response.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.NotNull(dataRequests);
            Assert.NotEmpty(dataRequests);
            Assert.Contains(dataRequests, dr => dr.SystemUserEmail == "admin.teste@example.com");
        }

        [Fact]
        public async Task GetDataRequestsByType_Deletion_ReturnsCorrectSeededData()
        {
            var response = await _client.GetAsync($"/api/DataRequest/ByType/{DataRequestType.Deletion}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var dataRequests = await response.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.NotNull(dataRequests);
            Assert.NotEmpty(dataRequests);
            Assert.Contains(dataRequests, dr => dr.SystemUserEmail == "operator.teste@example.com");
        }

        [Fact]
        public async Task GetDataRequestsByType_Rectification_ReturnsCorrectSeededData()
        {
            var response = await _client.GetAsync($"/api/DataRequest/ByType/{DataRequestType.Rectification}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var dataRequests = await response.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.NotNull(dataRequests);
            Assert.NotEmpty(dataRequests);
            Assert.Contains(dataRequests, dr => dr.SystemUserEmail == "portofficer.teste@example.com");
        }



        [Theory]
        [InlineData(DataRequestStatus.Pending)]
        [InlineData(DataRequestStatus.Completed)]
        [InlineData(DataRequestStatus.Rejected)]
        public async Task GetDataRequestsByStatus_WithValidStatus_ReturnsOkAndCorrectData(DataRequestStatus status)
        {
            var response = await _client.GetAsync($"/api/DataRequest/ByStatus/{status}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var dataRequests = await response.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.NotNull(dataRequests);
            
            if (dataRequests.Any())
            {
                Assert.All(dataRequests, dr => Assert.Equal(status, dr.Status));
            }
        }

        [Fact]
        public async Task GetDataRequestsByStatus_Pending_ReturnsCorrectSeededData()
        {
            var response = await _client.GetAsync($"/api/DataRequest/ByStatus/{DataRequestStatus.Pending}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var dataRequests = await response.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.NotNull(dataRequests);
            Assert.NotEmpty(dataRequests);
            Assert.Contains(dataRequests, dr => dr.SystemUserEmail == "admin.teste@example.com" 
                                                && dr.RequestType == DataRequestType.Access);
        }

        [Fact]
        public async Task GetDataRequestsByStatus_Completed_ReturnsCorrectSeededData()
        {
            var response = await _client.GetAsync($"/api/DataRequest/ByStatus/{DataRequestStatus.Completed}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var dataRequests = await response.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.NotNull(dataRequests);
            Assert.NotEmpty(dataRequests);
            Assert.Contains(dataRequests, dr => dr.SystemUserEmail == "operator.teste@example.com" 
                                                && dr.RequestType == DataRequestType.Deletion);
        }

        [Fact]
        public async Task GetDataRequestsByStatus_Rejected_ReturnsCorrectSeededData()
        {
            var response = await _client.GetAsync($"/api/DataRequest/ByStatus/{DataRequestStatus.Rejected}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var dataRequests = await response.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.NotNull(dataRequests);
            Assert.NotEmpty(dataRequests);
            Assert.Contains(dataRequests, dr => dr.SystemUserEmail == "portofficer.teste@example.com" 
                                                && dr.RequestType == DataRequestType.Rectification);
        }

        [Fact]
        public async Task PostDataRequest_WithValidData_ReturnsCreated()
        {
            var dto = new DataRequestDTO
            {
                SystemUserEmail = "admin.teste@example.com", // Existing SystemUser
                RequestType = DataRequestType.Access,
                Details = "Need to access my personal data"
            };

            var response = await _client.PostAsJsonAsync("/api/DataRequest", dto, _jsonOptions);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            
            var created = await response.Content.ReadFromJsonAsync<DataRequestDTO>(_jsonOptions);
            Assert.NotNull(created);
            Assert.NotEqual(0, created.Id);
            Assert.Equal(dto.SystemUserEmail, created.SystemUserEmail);
            Assert.Equal(dto.RequestType, created.RequestType);
            Assert.Equal(dto.Details, created.Details);
            Assert.Equal(DataRequestStatus.Pending, created.Status);
        }

        [Theory]
        [InlineData(DataRequestType.Access, "admin.teste@example.com", "I want to see my data")]
        [InlineData(DataRequestType.Deletion, "operator.teste@example.com", "Please delete all my data")]
        [InlineData(DataRequestType.Rectification, "portofficer.teste@example.com", "My email is incorrect")]
        public async Task PostDataRequest_WithDifferentTypes_ReturnsCreated(
            DataRequestType requestType, string email, string details)
        {
            var dto = new DataRequestDTO
            {
                SystemUserEmail = email,
                RequestType = requestType,
                Details = details
            };

            var response = await _client.PostAsJsonAsync("/api/DataRequest", dto, _jsonOptions);
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var created = await response.Content.ReadFromJsonAsync<DataRequestDTO>(_jsonOptions);
            Assert.NotNull(created);
            Assert.Equal(requestType, created.RequestType);
            Assert.Equal(email, created.SystemUserEmail);
            Assert.Equal(details, created.Details);
        }

        [Fact]
        public async Task PostDataRequest_WithNullDetails_ReturnsCreated()
        {
            var dto = new DataRequestDTO
            {
                SystemUserEmail = "rep1org1@email.com", // Existing Representative
                RequestType = DataRequestType.Access,
                Details = null
            };

            var response = await _client.PostAsJsonAsync("/api/DataRequest", dto, _jsonOptions);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            
            var created = await response.Content.ReadFromJsonAsync<DataRequestDTO>(_jsonOptions);
            Assert.NotNull(created);
            Assert.Null(created.Details);
        }

        [Fact]
        public async Task PostDataRequest_WithEmptyDetails_ReturnsCreated()
        {
            var dto = new DataRequestDTO
            {
                SystemUserEmail = "rep2org1@email.com", // Existing Representative
                RequestType = DataRequestType.Deletion,
                Details = ""
            };

            var response = await _client.PostAsJsonAsync("/api/DataRequest", dto, _jsonOptions);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            
            var created = await response.Content.ReadFromJsonAsync<DataRequestDTO>(_jsonOptions);
            Assert.NotNull(created);
            Assert.NotNull(created.Details);
        }

        [Fact]
        public async Task PostDataRequest_WithMaxLengthDetails_ReturnsCreated()
        {
            var maxDetails = new string('a', 500);
            var dto = new DataRequestDTO
            {
                SystemUserEmail = "rep1org2@email.com", // Existing Representative
                RequestType = DataRequestType.Rectification,
                Details = maxDetails
            };

            var response = await _client.PostAsJsonAsync("/api/DataRequest", dto, _jsonOptions);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            
            var created = await response.Content.ReadFromJsonAsync<DataRequestDTO>(_jsonOptions);
            Assert.NotNull(created);
            Assert.Equal(500, created.Details!.Length);
        }

        [Fact]
        public async Task PostDataRequest_WithDetailsExceedingMaxLength_ReturnsBadRequest()
        {
            var tooLongDetails = new string('a', 501);
            var dto = new DataRequestDTO
            {
                SystemUserEmail = "admin.teste@example.com", // Existing SystemUser
                RequestType = DataRequestType.Access,
                Details = tooLongDetails
            };

            var response = await _client.PostAsJsonAsync("/api/DataRequest", dto, _jsonOptions);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task PostDataRequest_WithNullEmail_ReturnsBadRequest()
        {
            var dto = new DataRequestDTO
            {
                SystemUserEmail = null!,
                RequestType = DataRequestType.Access,
                Details = "Some details"
            };

            var response = await _client.PostAsJsonAsync("/api/DataRequest", dto, _jsonOptions);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task PostDataRequest_WithEmptyEmail_ReturnsBadRequest()
        {
            var dto = new DataRequestDTO
            {
                SystemUserEmail = "",
                RequestType = DataRequestType.Access,
                Details = "Some details"
            };

            var response = await _client.PostAsJsonAsync("/api/DataRequest", dto, _jsonOptions);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task PostDataRequest_WithInvalidEmail_ReturnsBadRequest()
        {
            var dto = new DataRequestDTO
            {
                SystemUserEmail = "notanemail",
                RequestType = DataRequestType.Access,
                Details = "Some details"
            };

            var response = await _client.PostAsJsonAsync("/api/DataRequest", dto, _jsonOptions);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task PostDataRequest_WithNonExistentEmail_ReturnsBadRequest()
        {
            // Email that doesn't exist in SystemUsers or Representatives
            var dto = new DataRequestDTO
            {
                SystemUserEmail = "nonexistent@example.com",
                RequestType = DataRequestType.Access,
                Details = "Some details"
            };

            var response = await _client.PostAsJsonAsync("/api/DataRequest", dto, _jsonOptions);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>(_jsonOptions);
            Assert.NotNull(errors);
            Assert.Contains(errors, e => e.Contains("No system user or representative found"));
        }

        [Fact]
        public async Task PostDataRequest_WithSpecialCharactersInDetails_ReturnsCreated()
        {
            var dto = new DataRequestDTO
            {
                SystemUserEmail = "rep2org2@email.com", // Existing Representative
                RequestType = DataRequestType.Access,
                Details = "Special chars: !@#$%^&*()_+-=[]{}|;:',.<>?/~`"
            };

            var response = await _client.PostAsJsonAsync("/api/DataRequest", dto, _jsonOptions);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            
            var created = await response.Content.ReadFromJsonAsync<DataRequestDTO>(_jsonOptions);
            Assert.NotNull(created);
            Assert.Equal(dto.Details, created.Details);
        }

        [Fact]
        public async Task PostDataRequest_WithUnicodeCharactersInDetails_ReturnsCreated()
        {
            var dto = new DataRequestDTO
            {
                SystemUserEmail = "operator.teste@example.com", // Existing SystemUser
                RequestType = DataRequestType.Deletion,
                Details = "Unicode: café, naïve, 日本語, émojis 😀"
            };

            var response = await _client.PostAsJsonAsync("/api/DataRequest", dto, _jsonOptions);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            
            var created = await response.Content.ReadFromJsonAsync<DataRequestDTO>(_jsonOptions);
            Assert.NotNull(created);
            Assert.Equal(dto.Details, created.Details);
        }

        [Fact]
        public async Task PostDataRequest_MultipleRequestsFromSameEmail_AllCreatedSuccessfully()
        {
            var email = "portofficer.teste@example.com"; // Existing SystemUser
            var dto1 = new DataRequestDTO
            {
                SystemUserEmail = email,
                RequestType = DataRequestType.Access,
                Details = "First request"
            };
            var dto2 = new DataRequestDTO
            {
                SystemUserEmail = email,
                RequestType = DataRequestType.Deletion,
                Details = "Second request"
            };
            var dto3 = new DataRequestDTO
            {
                SystemUserEmail = email,
                RequestType = DataRequestType.Rectification,
                Details = "Third request"
            };

            var response1 = await _client.PostAsJsonAsync("/api/DataRequest", dto1, _jsonOptions);
            var response2 = await _client.PostAsJsonAsync("/api/DataRequest", dto2, _jsonOptions);
            var response3 = await _client.PostAsJsonAsync("/api/DataRequest", dto3, _jsonOptions);

            Assert.Equal(HttpStatusCode.Created, response1.StatusCode);
            Assert.Equal(HttpStatusCode.Created, response2.StatusCode);
            Assert.Equal(HttpStatusCode.Created, response3.StatusCode);

            var getResponse = await _client.GetAsync($"/api/DataRequest/ByEmail/{email}");
            getResponse.EnsureSuccessStatusCode();
            var requests = await getResponse.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.NotNull(requests);
            Assert.True(requests.Count >= 3);
        }

        [Fact]
        public async Task PostDataRequest_VerifyCreatedRequestIsRetrievable()
        {
            var dto = new DataRequestDTO
            {
                SystemUserEmail = "rep1org1@email.com", // Existing Representative
                RequestType = DataRequestType.Access,
                Details = "Verify this can be retrieved"
            };

            var postResponse = await _client.PostAsJsonAsync("/api/DataRequest", dto, _jsonOptions);
            Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);
            
            var created = await postResponse.Content.ReadFromJsonAsync<DataRequestDTO>(_jsonOptions);
            Assert.NotNull(created);

            var getResponse = await _client.GetAsync($"/api/DataRequest/ByID/{created.Id}");

            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
            var retrieved = await getResponse.Content.ReadFromJsonAsync<DataRequestDTO>(_jsonOptions);
            Assert.NotNull(retrieved);
            Assert.Equal(created.Id, retrieved.Id);
            Assert.Equal(created.SystemUserEmail, retrieved.SystemUserEmail);
            Assert.Equal(created.RequestType, retrieved.RequestType);
            Assert.Equal(created.Details, retrieved.Details);
        }

        [Theory]
        [InlineData("admin.teste@example.com")]
        [InlineData("operator.teste@example.com")]
        [InlineData("portofficer.teste@example.com")]
        [InlineData("rep1org1@email.com")]
        [InlineData("rep2org1@email.com")]
        public async Task PostDataRequest_WithExistingEmails_ReturnsCreated(string email)
        {
            var dto = new DataRequestDTO
            {
                SystemUserEmail = email,
                RequestType = DataRequestType.Access,
                Details = "Test with various email formats"
            };

            var response = await _client.PostAsJsonAsync("/api/DataRequest", dto, _jsonOptions);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            
            var created = await response.Content.ReadFromJsonAsync<DataRequestDTO>(_jsonOptions);
            Assert.NotNull(created);
            Assert.Equal(email, created.SystemUserEmail);
        }



        [Fact]
        public async Task CompleteWorkflow_CreateAndRetrieveDataRequest()
        {
            var createDto = new DataRequestDTO
            {
                SystemUserEmail = "rep1org2@email.com", // Existing Representative
                RequestType = DataRequestType.Access,
                Details = "Complete workflow test"
            };

            var createResponse = await _client.PostAsJsonAsync("/api/DataRequest", createDto, _jsonOptions);
            Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
            var created = await createResponse.Content.ReadFromJsonAsync<DataRequestDTO>(_jsonOptions);
            Assert.NotNull(created);

            var getByIdResponse = await _client.GetAsync($"/api/DataRequest/ByID/{created.Id}");
            Assert.Equal(HttpStatusCode.OK, getByIdResponse.StatusCode);

            var getByEmailResponse = await _client.GetAsync($"/api/DataRequest/ByEmail/{createDto.SystemUserEmail}");
            Assert.Equal(HttpStatusCode.OK, getByEmailResponse.StatusCode);
            var byEmail = await getByEmailResponse.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.Contains(byEmail!, dr => dr.Id == created.Id);

            var getByTypeResponse = await _client.GetAsync($"/api/DataRequest/ByType/{createDto.RequestType}");
            Assert.Equal(HttpStatusCode.OK, getByTypeResponse.StatusCode);
            var byType = await getByTypeResponse.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.Contains(byType!, dr => dr.Id == created.Id);

            var getByStatusResponse = await _client.GetAsync($"/api/DataRequest/ByStatus/{DataRequestStatus.Pending}");
            Assert.Equal(HttpStatusCode.OK, getByStatusResponse.StatusCode);
            var byStatus = await getByStatusResponse.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.Contains(byStatus!, dr => dr.Id == created.Id);

            var getAllResponse = await _client.GetAsync("/api/DataRequest");
            Assert.Equal(HttpStatusCode.OK, getAllResponse.StatusCode);
            var all = await getAllResponse.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);
            Assert.Contains(all!, dr => dr.Id == created.Id);
        }

        [Fact]
        public async Task FilteringByMultipleCriteria_ReturnsConsistentResults()
        {
            var pendingResponse = await _client.GetAsync($"/api/DataRequest/ByStatus/{DataRequestStatus.Pending}");
            pendingResponse.EnsureSuccessStatusCode();
            var pending = await pendingResponse.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);

            var accessResponse = await _client.GetAsync($"/api/DataRequest/ByType/{DataRequestType.Access}");
            accessResponse.EnsureSuccessStatusCode();
            var access = await accessResponse.Content.ReadFromJsonAsync<List<DataRequestDTO>>(_jsonOptions);

            var pendingAccessRequests = pending!.Where(p => p.RequestType == DataRequestType.Access).ToList();
            var accessPendingRequests = access!.Where(a => a.Status == DataRequestStatus.Pending).ToList();

            Assert.Equal(pendingAccessRequests.Count, accessPendingRequests.Count);
            foreach (var request in pendingAccessRequests)
            {
                Assert.Contains(accessPendingRequests, r => r.Id == request.Id);
            }
        }

    }
}