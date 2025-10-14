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

        private VesselType CreateVesselType(string name = "TypeA")
        {
            return new VesselType(name, "Desc", 100, 10, 5, 3);
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
        public async Task GetDocksByVesselTypes_ValidIds_ReturnsOk()
        {
            var vesselTypesResponse = await _client.GetAsync("/api/VesselType");
            vesselTypesResponse.EnsureSuccessStatusCode();
            var vesselTypes = await vesselTypesResponse.Content.ReadFromJsonAsync<List<VesselTypeDTO>>();
            Assert.NotNull(vesselTypes);
            Assert.True(vesselTypes.Count >= 2);

            var vesselTypeIds = vesselTypes.Take(2).Select(vt => vt.Id).ToList();

            var response = await _client.PostAsJsonAsync("/api/Dock/ByVesselTypes", vesselTypeIds);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var docks = await response.Content.ReadFromJsonAsync<List<DockDTO>>();
            Assert.NotNull(docks);
            Assert.NotEmpty(docks);
        }

        [Fact]
        public async Task GetDocksByVesselTypes_EmptyList_ReturnsBadRequest()
        {
            var response = await _client.PostAsJsonAsync("/api/Dock/ByVesselTypes", new List<int>());
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task GetDocksByVesselTypes_NonExistentIds_ReturnsNotFound()
        {
            var response = await _client.PostAsJsonAsync("/api/Dock/ByVesselTypes", new List<int> { 999 });
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}