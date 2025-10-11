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

namespace WebApi.IntegrationTests.Tests
{
    public class VesselTypeIntegrationTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public VesselTypeIntegrationTests(IntegrationTestsWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();
                Utilities.ReinitializeDbForTests(db);
            }
        }

        [Fact]
        public async Task GetAllVesselTypes_ReturnsOk()
        {
            var response = await _client.GetAsync("/api/VesselType");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("Aaaaaaa")]
        [InlineData("NonExistentType")]
        public async Task GetVesselTypeByName_NotFound(string name)
        {
            var response = await _client.GetAsync($"/api/VesselType/ByName/{name}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }


        [Theory]
        [InlineData("Teste1")]
        [InlineData("Teste2")]
        [InlineData("Teste3")]
        public async Task GetVesselTypeByName_Found(string name)
        {
            var response = await _client.GetAsync($"/api/VesselType/ByName/{name}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("DescriptionTeste1")]
        [InlineData("DescriptionTeste2")]
        [InlineData("DescriptionTeste3")]
        public async Task GetVesselTypeByDesciption_Found(string description)
        {
            var response = await _client.GetAsync($"/api/VesselType/ByDescription/{description}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("NonExistentDescription")]
        public async Task GetVesselTypeByDesciption_NotFound(string description)
        {
            var response = await _client.GetAsync($"/api/VesselType/ByDescription/{description}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }


        [Fact]
        public async Task PostVesselType_ThenGetByName_ReturnsCreatedAndOk()
        {
            var dto = new VesselTypeDTO
            {
                Name = "TestType",
                Description = "TestDesc",
                Capacity = 100,
                MaxRows = 10,
                MaxBays = 5,
                MaxTiers = 3
            };
            var postResponse = await _client.PostAsJsonAsync("/api/VesselType", dto);
            Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/VesselType/ByName/{dto.Name}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
            var returned = await getResponse.Content.ReadFromJsonAsync<VesselTypeDTO>();
            Assert.NotNull(returned);
            Assert.Equal(dto.Name, returned.Name);
        }

        // Names are duplicated because Utilities.cs seeds the database with VesselTypes having those names
        [Theory]
        [InlineData("Teste1", "Desc", 100, 10, 5, 3)]
        [InlineData("Teste2", "Desc", 200, 20, 10, 6)]
        [InlineData("Teste3", "Desc", 300, 30, 15, 9)]
        public async Task PostVesselType_DuplicateName_ReturnsConflict(string name, string description, int capacity, int maxRows, int maxBays, int maxTiers)
        {
            var dto = new VesselTypeDTO
            {
                Name = name,
                Description = description,
                Capacity = capacity,
                MaxRows = maxRows,
                MaxBays = maxBays,
                MaxTiers = maxTiers
            };
            var postResponse1 = await _client.PostAsJsonAsync("/api/VesselType", dto);
            Assert.Equal(HttpStatusCode.Conflict, postResponse1.StatusCode);
        }

        [Theory]
        [InlineData("NegativeType1", "Desc", -100, 5, 5, 3)]
        [InlineData("NegativeType2", "Desc", 100, -10, 5, 3)]
        [InlineData("NegativeType3", "Desc", 100, 5, -5, 3)]
        [InlineData("NegativeType4", "Desc", 100, 5, 5, -3)]
        public async Task PostVesselType_NegativeNumbers_ReturnsBadRequest(string name, string description, int capacity, int maxRows, int maxBays, int maxTiers)
        {
            var dto = new VesselTypeDTO
            {
                Name = name,
                Description = description,
                Capacity = capacity,
                MaxRows = maxRows,
                MaxBays = maxBays,
                MaxTiers = maxTiers
            };
            var postResponse = await _client.PostAsJsonAsync("/api/VesselType", dto);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

        [Fact]
        public async Task PutVesselType_UpdatesSuccessfully()
        {
            var dto = new VesselTypeDTO
            {
                Name = "UpdateType",
                Description = "Desc",
                Capacity = 100,
                MaxRows = 10,
                MaxBays = 5,
                MaxTiers = 3
            };
            await _client.PostAsJsonAsync("/api/VesselType", dto);

            dto.Description = "UpdatedDesc";
            var putResponse = await _client.PutAsJsonAsync($"/api/VesselType/Update/{dto.Name}", dto);
            Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/VesselType/ByName/{dto.Name}");
            var returned = await getResponse.Content.ReadFromJsonAsync<VesselTypeDTO>();
            Assert.NotNull(returned);
            Assert.Equal("UpdatedDesc", returned.Description);
        }


        [Theory]
        [InlineData("Teste1", "Desc", -100, 10, 5, 3)]
        [InlineData("Teste2", "Desc", 100, -10, 5, 3)]
        [InlineData("Teste3", "Desc", 200, 20, -10, 6)]
        [InlineData("Teste1", "Desc", 300, 30, 15, -9)]
        [InlineData("Teste2", "Desc", 400, -30, -15, -9)]
        public async Task PutVesselType_UpdateNegativeNumbers_ReturnsBadRequest(string name, string description, int capacity, int maxRows, int maxBays, int maxTiers)
        {
            var dto = new VesselTypeDTO
            {
                Name = name,
                Description = description,
                Capacity = capacity,
                MaxRows = maxRows,
                MaxBays = maxBays,
                MaxTiers = maxTiers
            };
            var putResponse = await _client.PutAsJsonAsync($"/api/VesselType/Update/{name}", dto);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }

        [Theory]
        [InlineData("Teste1", null, 100, 10, 5, 3)]
        [InlineData("Teste1", "    ", 100, 10, 5, 3)]
        [InlineData("Teste2", "", 100, 10, 5, 0)]
        public async Task PutVesselType_NullDescription_ReturnsBadRequest(string name, string? description, int capacity, int maxRows, int maxBays, int maxTiers)
        {
            var dto = new VesselTypeDTO
            {
                Name = name,
                Description = description,
                Capacity = capacity,
                MaxRows = maxRows,
                MaxBays = maxBays,
                MaxTiers = maxTiers
            };
            var putResponse = await _client.PutAsJsonAsync($"/api/VesselType/Update/{dto.Name}", dto);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }
        

        [Fact]
        public async Task GetVesselTypeById_NotFound()
        {
            var response = await _client.GetAsync("/api/VesselType/ByID/99999");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }


    }
}
