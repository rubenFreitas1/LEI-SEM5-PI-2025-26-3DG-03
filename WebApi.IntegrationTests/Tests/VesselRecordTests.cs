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
using Microsoft.Identity.Client;

namespace WebApi.IntegrationTests.Tests
{
    public class VesselRecordIntegrationTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public VesselRecordIntegrationTests(IntegrationTestsWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();

            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();
                Utilities.ReinitializeDbForTests(db);
            }
        }

        [Fact]
        public async Task GetVesselRecords_ReturnsAllVesselRecords()
        {
            var response = await _client.GetAsync("/api/VesselRecord");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("7654321")]
        [InlineData("NonExistentVesselRecord")]
        public async Task GetVesselRecordByImoNumber_NonExistent_ReturnsNotFound(string imoNumber)
        {
            var response = await _client.GetAsync($"/api/VesselRecord/imo/{imoNumber}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("1234567")]
        [InlineData("2345678")]
        public async Task GetVesselRecordByImoNumber_Existent_ReturnsVesselRecord(string imoNumber)
        {
            var response = await _client.GetAsync($"/api/VesselRecord/imo/{imoNumber}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("aaa")]
        [InlineData("bbb")]
        public async Task GetVesselRecordByName_NonExistent_ReturnsNotFound(string vesselName)
        {
            var response = await _client.GetAsync($"/api/VesselRecord/name/{vesselName}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("Vessel One")]
        [InlineData("Vessel Two")]
        public async Task GetVesselRecordByName_Existent_ReturnsVesselRecord(string vesselName)
        {
            var response = await _client.GetAsync($"/api/VesselRecord/name/{vesselName}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("op1")]
        [InlineData("op2")]
        public async Task GetVesselRecordsByOperator_NonExistent_ReturnsEmptyList(string operatorName)
        {
            var response = await _client.GetAsync($"/api/VesselRecord/operator/{operatorName}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("Operator A")]
        [InlineData("Operator B")]
        public async Task GetVesselRecordsByOperator_Existent_ReturnsVesselRecords(string operatorName)
        {
            var response = await _client.GetAsync($"/api/VesselRecord/operator/{operatorName}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetVesselRecordById_NotFound()
        {
            var response = await _client.GetAsync($"/api/VesselRecord/9999");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetVesselRecordById_Found()
        {
            var response = await _client.GetAsync("/api/VesselRecord");
            response.EnsureSuccessStatusCode();
            var records = await response.Content.ReadFromJsonAsync<List<VesselRecordDTO>>();
            Assert.NotNull(records);
            Assert.NotEmpty(records);

            foreach (var record in records)
            {
                var getByIdResponse = await _client.GetAsync($"/api/VesselRecord/{record.Id}");
                Assert.Equal(HttpStatusCode.OK, getByIdResponse.StatusCode);
                var recordById = await getByIdResponse.Content.ReadFromJsonAsync<VesselRecordDTO>();
                Assert.NotNull(recordById);
                Assert.Equal(record.IMONumber, recordById.IMONumber);
            }

        }

        [Theory]
        [InlineData("1234567", "New Vessel Name", "Vessel Type 1", "New Operator")]
        [InlineData("2345678", "Another Vessel Name", "Vessel Type 2", "Another Operator")]
        public async Task PutVesselRecord_UpdatesSuccessfully(string imoNumber, string newVesselName, string newVesselTypeName, string newOperator)
        {
            var response = await _client.GetAsync($"/api/VesselRecord/imo/{imoNumber}");
            response.EnsureSuccessStatusCode();
            var vesselRecord = await response.Content.ReadFromJsonAsync<VesselRecordDTO>();
            Assert.NotNull(vesselRecord);

            vesselRecord.VesselName = newVesselName;
            vesselRecord.VesselTypeName = newVesselTypeName;
            vesselRecord.Operator = newOperator;

            var putResponse = await _client.PutAsJsonAsync($"/api/VesselRecord/{vesselRecord.Id}", vesselRecord);
            Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

            var getUpdatedResponse = await _client.GetAsync($"/api/VesselRecord/{vesselRecord.Id}");
            if (getUpdatedResponse.StatusCode != HttpStatusCode.OK)
            {
                var errorContent = await getUpdatedResponse.Content.ReadAsStringAsync();
                throw new Xunit.Sdk.XunitException($"Failed to retrieve updated vessel record. Status Code: {getUpdatedResponse.StatusCode}, Content: {errorContent}");
            }
            var returned = await getUpdatedResponse.Content.ReadFromJsonAsync<VesselRecordDTO>();
            Assert.NotNull(returned);
            Assert.Equal(newVesselName, returned.VesselName);
            Assert.Equal(newVesselTypeName, returned.VesselTypeName);
            Assert.Equal(newOperator, returned.Operator);
        }


        [Theory]
        [InlineData("123456", "Valid Name", "Vessel Type 1", "Valid Operator")] // IMO number too short
        [InlineData("12345678", "Valid Name", "Vessel Type 1", "Valid Operator")] // IMO number too long
        [InlineData("12345A7", "Valid Name", "Vessel Type 1", "Valid Operator")] // IMO number with non-digit
        [InlineData("1234567", "", "Vessel Type 1", "Valid Operator")] // Empty vessel name
        [InlineData("1234567", "Valid Name", "", "Valid Operator")] // Empty vessel type
        [InlineData("1234567", "Valid Name", "Vessel Type 1", "")] // Empty operator
        [InlineData("1234560", "Valid Name", "Vessel Type 1", "Valid Operator")] // Invalid IMO number (check digit)
        public async Task PutVesselRecord_InvalidData_ReturnsBadRequest(string imoNumber, string vesselName, string vesselTypeName, string operatorName)
        {
            var response = await _client.GetAsync($"/api/VesselRecord/imo/{imoNumber}");
            VesselRecordDTO vesselRecord;
            if (response.StatusCode == HttpStatusCode.OK)
            {
                vesselRecord = await response.Content.ReadFromJsonAsync<VesselRecordDTO>() ?? new VesselRecordDTO();
            }
            else
            {
                vesselRecord = new VesselRecordDTO
                {
                    IMONumber = imoNumber
                };
            }

            vesselRecord.VesselName = vesselName;
            vesselRecord.VesselTypeName = vesselTypeName;
            vesselRecord.Operator = operatorName;

            var putResponse = await _client.PutAsJsonAsync($"/api/VesselRecord/{vesselRecord.Id}", vesselRecord);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }


        [Theory]
        [InlineData("1234567", "Vessel One", "Vessel Type 1", "Operator A")]
        [InlineData("2345678", "Vessel Two", "Vessel Type 2", "Operator B")]
        public async Task PutVesselRecord_DuplicateImoNumber_ReturnsBadRequest(string imoNumber, string vesselName, string vesselTypeName, string operatorName)
        {
            var response = await _client.GetAsync($"/api/VesselRecord/imo/{imoNumber}");
            response.EnsureSuccessStatusCode();
            var vesselRecord = await response.Content.ReadFromJsonAsync<VesselRecordDTO>();
            Assert.NotNull(vesselRecord);

            var newVesselRecord = new VesselRecordDTO
            {
                IMONumber = imoNumber,
                VesselName = "New Vessel",
                VesselTypeName = "Vessel Type 1",
                Operator = "New Operator"
            };

            var putResponse = await _client.PutAsJsonAsync($"/api/VesselRecord/{vesselRecord.Id}", newVesselRecord);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }

        [Fact]
        public async Task PostVesselRecord_CreatesSuccessfully()
        {
            var newVesselRecord = new VesselRecordDTO
            {
                IMONumber = "3456789",
                VesselName = "New Vessel",
                VesselTypeName = "Vessel Type 1",
                Operator = "New Operator"
            };

            var postResponse = await _client.PostAsJsonAsync("/api/VesselRecord", newVesselRecord);
            Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

            var createdRecord = await postResponse.Content.ReadFromJsonAsync<VesselRecordDTO>();
            Assert.NotNull(createdRecord);
            Assert.Equal(newVesselRecord.IMONumber, createdRecord.IMONumber);
            Assert.Equal(newVesselRecord.VesselName, createdRecord.VesselName);
            Assert.Equal(newVesselRecord.VesselTypeName, createdRecord.VesselTypeName);
            Assert.Equal(newVesselRecord.Operator, createdRecord.Operator);
        }

        [Theory]
        [InlineData("1234567", "Valid Name", "Vessel Type 1", "Valid Operator")] // Duplicate IMO number
        [InlineData("123456", "Valid Name", "Vessel Type 1", "Valid Operator")] // IMO number too short
        [InlineData("12345678", "Valid Name", "Vessel Type 1", "Valid Operator")] // IMO number too long
        [InlineData("12345A7", "Valid Name", "Vessel Type 1", "Valid Operator")] // IMO number with non-digit
        [InlineData("1234567", "", "Vessel Type 1", "Valid Operator")] // Empty vessel name
        [InlineData("1234567", "Valid Name", "", "Valid Operator")] // Empty vessel type
        [InlineData("1234567", "Valid Name", "Vessel Type 1", "")] // Empty operator
        [InlineData("1234560", "Valid Name", "Vessel Type 1", "Valid Operator")] // Invalid IMO number (check digit)
        public async Task PostVesselRecord_InvalidData_ReturnsBadRequest(string imoNumber, string vesselName, string vesselTypeName, string operatorName)
        {
            var newVesselRecord = new VesselRecordDTO
            {
                IMONumber = imoNumber,
                VesselName = vesselName,
                VesselTypeName = vesselTypeName,
                Operator = operatorName
            };

            var postResponse = await _client.PostAsJsonAsync("/api/VesselRecord", newVesselRecord);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

        [Fact]
        public async Task PostVesselRecord_NonExistentVesselType_ReturnsBadRequest()
        {
            var newVesselRecord = new VesselRecordDTO
            {
                IMONumber = "4567890",
                VesselName = "New Vessel",
                VesselTypeName = "NonExistentType",
                Operator = "New Operator"
            };

            var postResponse = await _client.PostAsJsonAsync("/api/VesselRecord", newVesselRecord);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }


        [Theory]
        [InlineData("1234567", "New Vessel Name", "Vessel Type 1", "New Operator")]
        [InlineData("2345678", "Another Vessel Name", "Vessel Type 2", "Another Operator")]
        public async Task PostVesselRecord_ThenGetByImoNumber_ReturnsCreatedAndOk(string imoNumber, string vesselName, string vesselTypeName, string operatorName)
        {
            var newVesselRecord = new VesselRecordDTO
            {
                IMONumber = imoNumber,
                VesselName = vesselName,
                VesselTypeName = vesselTypeName,
                Operator = operatorName
            };

            var postResponse = await _client.PostAsJsonAsync("/api/VesselRecord", newVesselRecord);
            Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/VesselRecord/imo/{imoNumber}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

            var fetchedRecord = await getResponse.Content.ReadFromJsonAsync<VesselRecordDTO>();
            Assert.NotNull(fetchedRecord);
            Assert.Equal(newVesselRecord.IMONumber, fetchedRecord.IMONumber);
            Assert.Equal(newVesselRecord.VesselName, fetchedRecord.VesselName);
            Assert.Equal(newVesselRecord.VesselTypeName, fetchedRecord.VesselTypeName);
            Assert.Equal(newVesselRecord.Operator, fetchedRecord.Operator);

        }

        [Theory]
        [InlineData("1234567", "New Vessel Name", "Vessel Type 1", "New Operator")]
        [InlineData("2345678", "Another Vessel Name", "Vessel Type 2", "Another Operator")]
        public async Task PostVesselRecord_DuplicateImoNumber_ReturnsBadRequest(string imoNumber, string vesselName, string vesselTypeName, string operatorName)
        {
            var newVesselRecord = new VesselRecordDTO
            {
                IMONumber = imoNumber,
                VesselName = vesselName,
                VesselTypeName = vesselTypeName,
                Operator = operatorName
            };

            var postResponse = await _client.PostAsJsonAsync("/api/VesselRecord", newVesselRecord);
            Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);
        }
    }
}