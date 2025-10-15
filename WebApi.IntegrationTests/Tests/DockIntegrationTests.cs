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

namespace WebApi.IntegrationTests.Tests
{
    public class DockIntegrationTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;



        public DockIntegrationTests(IntegrationTestsWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();

            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();
                Utilities.ReinitializeDbForTests(db);
            }
        }


        [Fact]
        public async Task GetAllDocks_ReturnsOk()
        {
            var response = await _client.GetAsync("/api/Dock");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("Aaaaaaa")]
        [InlineData("NonExistentDock")]
        public async Task GetDockByName_NotFound(string name)
        {
            var response = await _client.GetAsync($"/api/Dock/ByName/{name}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("Dock A")]
        [InlineData("Dock B")]
        public async Task GetDockByName_Found(string name)
        {
            var response = await _client.GetAsync($"/api/Dock/ByName/{name}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("Port 1")]
        [InlineData("Port 2")]
        public async Task GetDocksByLocation_Found(string location)
        {
            var response = await _client.GetAsync($"/api/Dock/ByLocation/{location}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("Unknown Port")]
        [InlineData("NonExistentLocation")]
        public async Task GetDocksByLocation_NotFound(string location)
        {
            var response = await _client.GetAsync($"/api/Dock/ByLocation/{location}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetDockById_NotFound()
        {
            var response = await _client.GetAsync("/api/Dock/ByID/99999");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetDockById_Found()
        {
            var response = await _client.GetAsync("/api/Dock");
            response.EnsureSuccessStatusCode();
            var docks = await response.Content.ReadFromJsonAsync<List<DockDTO>>();
            Assert.NotNull(docks);
            Assert.NotEmpty(docks);

            foreach (var dock in docks)
            {
                var getByIdResponse = await _client.GetAsync($"/api/Dock/ByID/{dock.Id}");
                Assert.Equal(HttpStatusCode.OK, getByIdResponse.StatusCode);
                var returned = await getByIdResponse.Content.ReadFromJsonAsync<DockDTO>();
                Assert.NotNull(returned);
                Assert.Equal(dock.Name, returned.Name);
            }
        }


        [Theory]
        [InlineData("Teste1", "Teste2")]
        [InlineData("Teste2")]
        [InlineData("Teste3")]
        public async Task GetDocksByVesselTypes_ValidNames_ReturnsOk(params string[] vesselTypeNames)
        {

            var response = await _client.PostAsJsonAsync("/api/Dock/ByVesselTypes", vesselTypeNames);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var docks = await response.Content.ReadFromJsonAsync<List<DockDTO>>();
            Assert.NotNull(docks);
            Assert.NotEmpty(docks);
        }

        [Fact]
        public async Task GetDocksByVesselTypes_EmptyNames_ReturnsBadRequest()
        {
            var response = await _client.PostAsJsonAsync("/api/Dock/ByVesselTypes", new string[] { });
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task GetDocksByVesselTypes_NullNames_ReturnsBadRequest()
        {
            var response = await _client.PostAsJsonAsync("/api/Dock/ByVesselTypes", (string[])null!);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task GetDocksByVesselTypes_NonExistentNames_ReturnsNotFound()
        {
            var response = await _client.PostAsJsonAsync("/api/Dock/ByVesselTypes", new[] { "NonExistentType1", "NonExistentType2" });
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }



        [Theory]
        [InlineData("Dock Teste", "New Location", 600, 35, 18, new[] { "Teste1", "Teste2" })]
        [InlineData("Dock Teste 2", "New Location 2", 700, 40, 20, new[] { "Teste1" })]
        [InlineData("Dock Teste 3", "New Location 3", 800, 50, 25, new[] { "Teste2", "Teste3" })]
        public async Task PutDock_UpdatesSuccessfully(string name, string location, int length, int depth, int maxDraft, string[] vesselTypeNames)
        {

            var response = await _client.GetAsync("/api/Dock/ByName/Dock A");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var dock = await response.Content.ReadFromJsonAsync<DockDTO>();
            Assert.NotNull(dock);

            dock.Name = name;
            dock.Location = location;
            dock.Length = length;
            dock.Depth = depth;
            dock.MaxDraft = maxDraft;
            dock.VesselTypesAllowed = vesselTypeNames.ToList();

            var putResponse = await _client.PutAsJsonAsync($"/api/Dock/Update/{dock.Id}", dock);
            Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

            // Buscar pelo id após o update para garantir que o dock foi alterado
            var getResponse = await _client.GetAsync($"/api/Dock/ById/{dock.Id}");
            if (getResponse.StatusCode != HttpStatusCode.OK)
            {
                var errorContent = await getResponse.Content.ReadAsStringAsync();
                throw new Xunit.Sdk.XunitException($"Expected OK but got {getResponse.StatusCode}. Response content: {errorContent}");
            }
            var returned = await getResponse.Content.ReadFromJsonAsync<DockDTO>();
            Assert.NotNull(returned);
            Assert.Equal(name, returned.Name);
            Assert.Equal(location, returned.Location);
            Assert.Equal(length, returned.Length);
            Assert.Equal(depth, returned.Depth);
            Assert.Equal(maxDraft, returned.MaxDraft);
            Assert.Equal(vesselTypeNames.Length, returned.VesselTypesAllowed?.Count);
        }

        [Theory]
        [InlineData("Dock A", "Port 2", 600, 35, 18, new[] { "Teste1", "Teste2" })]
        [InlineData("Dock B", "Port 1", 700, 40, 20, new[] { "Teste1" })]
        public async Task PutDock_DuplicateLocation_ReturnsBadRequest(string name, string location, string[] vesselTypeNames)
        {
            var response = await _client.GetAsync($"/api/Dock/ByName/{name}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var dock = await response.Content.ReadFromJsonAsync<DockDTO>();
            Assert.NotNull(dock);

            dock.Location = location;

            var putResponse = await _client.PutAsJsonAsync($"/api/Dock/Update/{dock.Id}", dock);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }

        [Fact]
        public async Task PutDock_DuplicateName_ReturnsBadRequest()
        {
            var response = await _client.GetAsync($"/api/Dock/ByName/Dock A");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var dock = await response.Content.ReadFromJsonAsync<DockDTO>();
            Assert.NotNull(dock);

            dock.Name = "Dock B";

            var putResponse = await _client.PutAsJsonAsync($"/api/Dock/Update/{dock.Id}", dock);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }

        [Theory]
        [InlineData("Dock A", "New Unique Location", -100, 35, 18, new[] { "Teste1", "Teste2" })] // Negative length
        [InlineData("Dock B", "Another Unique Location", 700, -5, 20, new[] { "Teste1" })] // Negative depth
        [InlineData("Dock A", "Unique Location 3", 800, 50, -10, new[] { "Teste2", "Teste3" })] // Negative max draft
        [InlineData("Dock B", "Unique Location 4", 900, 60, 30, new string[] { })] // Empty vessel types
        [InlineData("Dock A", "Unique Location 5", 1000, 70, 35, new[] { "NonExistentType" })] // Non-existent vessel type
        [InlineData("Dock B", "", 1100, 80, 40, new[] { "Teste1" })] // Empty location
        [InlineData("Dock A", "   ", 1200, 90, 45, new[] { "Teste2" })] // Whitespace location
        [InlineData("Dock B", null, 4, 100, 50, new[] { "Teste3" })] // null location
        [InlineData("", "Valid Location", 100, 110, 55, new[] { "Teste1" })] // Empty name
        [InlineData("   ", "Valid Location 2", 200, 120, 60, new[] { "Teste2" })] // Whitespace name
        [InlineData(null, "Valid Location 3", 300, 130, 65, new[] { "Teste3" })] // null name
        public async Task PutDock_InvalidData_ReturnsBadRequest(string? name, string? location, int length, int depth, int maxDraft, string[] vesselTypeNames)
        {
            var response = await _client.GetAsync($"/api/Dock/ByName/Dock A");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var dock = await response.Content.ReadFromJsonAsync<DockDTO>();
            Assert.NotNull(dock);

            dock.Name = name;
            dock.Length = length;
            dock.Location = location;
            dock.Depth = depth;
            dock.MaxDraft = maxDraft;
            dock.VesselTypesAllowed = vesselTypeNames.ToList();

            var putResponse = await _client.PutAsJsonAsync($"/api/Dock/Update/{dock.Id}", dock);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }

        [Theory]
        [InlineData("Dock C", "Location A", 100, 50, 25, new[] { "Teste1", "Teste2" })]
        [InlineData("Dock D", "Location B", 200, 60, 30, new[] { "Teste3" })]
        [InlineData("Dock E", "Location C", 300, 70, 35, new[] { "Teste1", "Teste3", "Teste2" })]
        public async Task PostDock_ThenGetByName_ReturnsCreatedAndOk(string name, string location, int length, int depth, int maxDraft, string[] vesselTypeNames)
        {
            var newDock = new DockDTO
            {
                Name = name,
                Location = location,
                Length = length,
                Depth = depth,
                MaxDraft = maxDraft,
                VesselTypesAllowed = vesselTypeNames.ToList()
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Dock", newDock);
            Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/Dock/ByName/{name}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

            var returnedDock = await getResponse.Content.ReadFromJsonAsync<DockDTO>();
            Assert.NotNull(returnedDock);
            Assert.Equal(name, returnedDock.Name);
            Assert.Equal(location, returnedDock.Location);
            Assert.Equal(length, returnedDock.Length);
            Assert.Equal(depth, returnedDock.Depth);
            Assert.Equal(maxDraft, returnedDock.MaxDraft);
            Assert.Equal(vesselTypeNames.Length, returnedDock.VesselTypesAllowed?.Count);
        }

        [Theory]
        [InlineData("Dock A", "Unique Location", 100, 50, 25, new[] { "Teste1", "Teste2" })]
        [InlineData("Dock B", "Another Unique Location", 200, 60, 30, new[] { "Teste3" })]
        public async Task PostDock_DuplicateName_ReturnsConflict(string name, string location, int length, int depth, int maxDraft, string[] vesselTypeNames)
        {
            var newDock = new DockDTO
            {
                Name = name,
                Location = location,
                Length = length,
                Depth = depth,
                MaxDraft = maxDraft,
                VesselTypesAllowed = vesselTypeNames.ToList()
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Dock", newDock);
            Assert.Equal(HttpStatusCode.Conflict, postResponse.StatusCode);
        }


        [Theory]
        [InlineData("Unique Dock", "Port 1", 100, 50, 25, new[] { "Teste1", "Teste2" })]
        [InlineData("Another Unique Dock", "Port 2", 200, 60, 30, new[] { "Teste3" })]
        public async Task PostDock_DuplicateLocation_ReturnsConflict(string name, string location, int length, int depth, int maxDraft, string[] vesselTypeNames)
        {
            var newDock = new DockDTO
            {
                Name = name,
                Location = location,
                Length = length,
                Depth = depth,
                MaxDraft = maxDraft,
                VesselTypesAllowed = vesselTypeNames.ToList()
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Dock", newDock);
            Assert.Equal(HttpStatusCode.Conflict, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("", "Location A", 100, 50, 25, new[] { "Teste1", "Teste2" })] // Empty name
        [InlineData("   ", "Location B", 200, 60, 30, new[] { "Teste3" })] // Whitespace name
        [InlineData(null, "Location C", 300, 70, 35, new[] { "Teste1", "Teste3", "Teste2" })] // null name
        [InlineData("Valid Name", "", 300, 70, 35, new[] { "Teste1" })] // Empty location
        [InlineData("Valid Name 2", "   ", 400, 80, 40, new[] { "Teste2" })] // Whitespace location
        [InlineData("Valid Name 3", null, 500, 90, 45, new[] { "Teste3" })] // null location
        [InlineData("Valid Name 4", "Valid Location", -100, 100, 50, new[] { "Teste1" })] // Negative length
        [InlineData("Valid Name 5", "Valid Location 2", 600, -10, 60, new[] { "Teste2" })] // Negative depth
        [InlineData("Valid Name 6", "Valid Location 3", 700, 110, -20, new[] { "Teste3" })] // Negative max draft
        [InlineData("Valid Name 7", "Valid Location 4", 800, 120, 70, new string[] { })] // Empty vessel types
        [InlineData("Valid Name 8", "Valid Location 5", 900, 130, 80, new[] { "NonExistentType" })] // Non-existent vessel type
        public async Task PostDock_InvalidData_ReturnsBadRequest(string? name, string? location, int length, int depth, int maxDraft, string[] vesselTypeNames)
        {
            var newDock = new DockDTO
            {
                Name = name,
                Location = location,
                Length = length,
                Depth = depth,
                MaxDraft = maxDraft,
                VesselTypesAllowed = vesselTypeNames.ToList()
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Dock", newDock);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }
    }
}