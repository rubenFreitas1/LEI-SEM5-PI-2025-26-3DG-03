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

    public class StorageAreaIntegrationTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public StorageAreaIntegrationTests(IntegrationTestsWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();
                Utilities.ReinitializeDbForTests(db);
            }
        }

        [Fact]
        public async Task GetAllStorageAreas_ReturnsOk()
        {
            var response = await _client.GetAsync("/api/StorageArea");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("NONEXISTENTCODE")]
        [InlineData("INVALID123")]
        public async Task GetStorageAreaByCode_NotFound(string code)
        {
            var response = await _client.GetAsync($"/api/StorageArea/ByCode/{code}x");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("WH001")]
        [InlineData("WH002")]
        public async Task GetStorageAreaByCode_Found(string code)
        {
            var response = await _client.GetAsync($"/api/StorageArea/ByCode/{code}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData(9999)]
        [InlineData(1234)]
        public async Task GetStorageAreaById_NotFound(int id)
        {
            var response = await _client.GetAsync($"/api/StorageArea/ById/{id}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetStorageAreaById_Found()
        {
            var response = await _client.GetAsync($"/api/StorageArea");
            response.EnsureSuccessStatusCode();
            var storageAreas = await response.Content.ReadFromJsonAsync<IEnumerable<StorageAreaDTO>>();
            Assert.NotNull(storageAreas);
            Assert.NotEmpty(storageAreas);
            foreach (var storageArea in storageAreas!)
            {
                var getByIdResponse = await _client.GetAsync($"/api/StorageArea/ById/{storageArea.Id}");
                Assert.Equal(HttpStatusCode.OK, getByIdResponse.StatusCode);
            }
        }


        [Theory]
        [InlineData("NonExistentLocation")]
        [InlineData("UnknownPlace")]
        public async Task GetStorageAreaByLocation_NotFound(string location)
        {
            var response = await _client.GetAsync($"/api/StorageArea/ByLocation/{location}x");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("North")]
        [InlineData("South")]
        public async Task GetStorageAreaByLocation_Found(string location)
        {
            var response = await _client.GetAsync($"/api/StorageArea/ByLocation/{location}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("WH003", "Warehouse 3", StorageAreaType.Warehouse, 500, 10)]
        [InlineData("YD001", "Yard 1", StorageAreaType.Yard, 200, 0)]
        public async Task PostStorageArea_ThenGetByCode_ReturnsCreatedAndOk(string code, string location, StorageAreaType type, int maxCapacity, int currentCapacity)
        {
            var newStorageArea = new StorageAreaDTO
            {
                Code = code,
                Location = location,
                StorageAreaType = type,
                MaxCapacity = maxCapacity,
                CurrentCapacity = currentCapacity,
                StorageAreaDocks = new List<StorageAreaDockDTO>()
            };

            var docksResp = await _client.GetAsync("/api/Dock");
            docksResp.EnsureSuccessStatusCode();
            var docks = await docksResp.Content.ReadFromJsonAsync<List<DockDTO>>();
            if (docks != null && docks.Count > 0)
            {
                newStorageArea.StorageAreaDocks.Add(new StorageAreaDockDTO { DockName = docks[0].Name!, Distance = 12.5 });
            }

            var postResponse = await _client.PostAsJsonAsync("/api/StorageArea", newStorageArea);
            Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/StorageArea/ByCode/{code}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
            var returned = await getResponse.Content.ReadFromJsonAsync<StorageAreaDTO>();
            Assert.NotNull(returned);
            Assert.Equal(code, returned.Code);
            Assert.Equal(location, returned.Location);
            Assert.Equal(maxCapacity, returned.MaxCapacity);
        }

        [Theory]
        [InlineData("WH001", "New Location", StorageAreaType.Warehouse, 1000, 0)]
        [InlineData("WH002", "Another Location", StorageAreaType.Warehouse, 2000, 0)]
        public async Task PostStorageArea_DuplicateCode_ReturnsConflict(string code, string location, StorageAreaType type, int maxCapacity, int currentCapacity)
        {
            var newStorageArea = new StorageAreaDTO
            {
                Code = code,
                Location = location,
                StorageAreaType = type,
                MaxCapacity = maxCapacity,
                CurrentCapacity = currentCapacity,
                StorageAreaDocks = new List<StorageAreaDockDTO>()
            };

            var postResponse = await _client.PostAsJsonAsync("/api/StorageArea", newStorageArea);
            Assert.Equal(HttpStatusCode.Conflict, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("WH111", "North", StorageAreaType.Warehouse, 1000, 0)]
        [InlineData("WH122", "South", StorageAreaType.Warehouse, 2000, 0)]
        public async Task PostStorageArea_DuplicateLocation_ReturnsConflict(string code, string location, StorageAreaType type, int maxCapacity, int currentCapacity)
        {
            var newStorageArea = new StorageAreaDTO
            {
                Code = code,
                Location = location,
                StorageAreaType = type,
                MaxCapacity = maxCapacity,
                CurrentCapacity = currentCapacity,
                StorageAreaDocks = new List<StorageAreaDockDTO>()
            };

            var postResponse = await _client.PostAsJsonAsync("/api/StorageArea", newStorageArea);
            Assert.Equal(HttpStatusCode.Conflict, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("", "Loc", StorageAreaType.Yard, 100, 0)]
        [InlineData("CODE1", "", StorageAreaType.Warehouse, 100, 0)]
        [InlineData("CODE2", "Loc", StorageAreaType.Warehouse, -1, 0)]
        [InlineData("CODE3", "Loc", StorageAreaType.Warehouse, 100, -5)]
        [InlineData("CODE4 dsdsa", "Loc", StorageAreaType.Warehouse, 250, 200)]
        [InlineData("CODE5", "Loc", (StorageAreaType)999, 100, 0)] // Invalid enum value
        [InlineData("CODE6", "Loc", StorageAreaType.Warehouse, 100, 150)] // currentCapacity > maxCapacity
        [InlineData(null, "Loc", StorageAreaType.Warehouse, 100, 0)]
        [InlineData("CODE7", null, StorageAreaType.Warehouse, 100, 0)]
        public async Task PostStorageArea_InvalidData_ReturnsBadRequest(string? code, string? location, StorageAreaType type, int maxCapacity, int currentCapacity)
        {
            var newStorageArea = new StorageAreaDTO
            {
                Code = code!,
                Location = location!,
                StorageAreaType = type,
                MaxCapacity = maxCapacity,
                CurrentCapacity = currentCapacity,
                StorageAreaDocks = new List<StorageAreaDockDTO>()
            };

            var postResponse = await _client.PostAsJsonAsync("/api/StorageArea", newStorageArea);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }
        
        [Fact]
        public async Task PostStorageArea_InvalidDocks_ReturnsBadRequest()
        {
            var newStorageArea = new StorageAreaDTO
            {
                Code = "WH999",
                Location = "Nowhere",
                StorageAreaType = StorageAreaType.Warehouse,
                MaxCapacity = 1000,
                CurrentCapacity = 100,
                StorageAreaDocks = new List<StorageAreaDockDTO>
                {
                    new StorageAreaDockDTO { DockName = "NonExistentDock", Distance = 10 }
                }
            };
            var postResponse = await _client.PostAsJsonAsync("/api/StorageArea", newStorageArea);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }



        [Fact]
        public async Task PutStorageArea_UpdatesSuccessfully()
        {
            var response = await _client.GetAsync("/api/StorageArea");
            response.EnsureSuccessStatusCode();
            var storageAreas = await response.Content.ReadFromJsonAsync<List<StorageAreaDTO>>();
            Assert.NotNull(storageAreas);
            var sa = storageAreas![0];

            sa.Location = sa.Location + " Updated";
            sa.MaxCapacity = sa.MaxCapacity + 100;

            var putResponse = await _client.PutAsJsonAsync($"/api/StorageArea/Update/{sa.Id}", sa);
            Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/StorageArea/ById/{sa.Id}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
            var returned = await getResponse.Content.ReadFromJsonAsync<StorageAreaDTO>();
            Assert.NotNull(returned);
            Assert.Equal(sa.Location, returned.Location);
            Assert.Equal(sa.MaxCapacity, returned.MaxCapacity);
        }

        [Fact]
        public async Task PutStorageArea_DuplicateLocation_ReturnsConflict()
        {
            var response = await _client.GetAsync("/api/StorageArea");
            response.EnsureSuccessStatusCode();
            var storageAreas = await response.Content.ReadFromJsonAsync<List<StorageAreaDTO>>();
            Assert.NotNull(storageAreas);
            Assert.True(storageAreas!.Count >= 2);

            var target = storageAreas[0];
            var other = storageAreas[1];

            target.Location = other.Location;
            var putResponse = await _client.PutAsJsonAsync($"/api/StorageArea/Update/{target.Id}", target);
            Assert.Equal(HttpStatusCode.Conflict, putResponse.StatusCode);
        }

        [Theory]
        [InlineData("", "Loc", StorageAreaType.Yard, 100, 0)] //cannot change code
        [InlineData("WHOO1", "Loc", StorageAreaType.Warehouse, -1, 0)] //invalid max capacity
        [InlineData("WH001", "Loc", StorageAreaType.Warehouse, 100, -5)] //invalid current capacity
        [InlineData("WH001", "Loc", (StorageAreaType)999, 100, 0)] // Invalid enum value
        [InlineData("WH001", "Loc", StorageAreaType.Warehouse, 100, 150)] // currentCapacity > maxCapacity
        [InlineData("WH001", null, StorageAreaType.Warehouse, 100, 0)] //null location
        [InlineData("WH001", "", StorageAreaType.Warehouse, 100, 0)] //empty location
        [InlineData("WH001", "Loc", StorageAreaType.Warehouse, 0, 0)] //zero max capacity
        public async Task PutStorageArea_InvalidData_ReturnsBadRequest(string? code, string? location, StorageAreaType type, int maxCapacity, int currentCapacity)
        {
            var response = await _client.GetAsync("/api/StorageArea/ByCode/WH001");
            response.EnsureSuccessStatusCode();
            var storageArea = await response.Content.ReadFromJsonAsync<StorageAreaDTO>();
            Assert.NotNull(storageArea);


            storageArea.Code = code!;
            storageArea.Location = location!;
            storageArea.StorageAreaType = type;
            storageArea.MaxCapacity = maxCapacity;
            storageArea.CurrentCapacity = currentCapacity;

            var putResponse = await _client.PutAsJsonAsync($"/api/StorageArea/Update/{storageArea.Id}", storageArea);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }
        
        [Fact]
        public async Task PutStorageArea_InvalidDocks_ReturnsBadRequest()
        {
            var response = await _client.GetAsync("/api/StorageArea/ByCode/WH001");
            response.EnsureSuccessStatusCode();
            var storageArea = await response.Content.ReadFromJsonAsync<StorageAreaDTO>();
            Assert.NotNull(storageArea);

            storageArea.StorageAreaDocks = new List<StorageAreaDockDTO>
            {
                new StorageAreaDockDTO { DockName = "NonExistentDock", Distance = 10 }
            };

            var putResponse = await _client.PutAsJsonAsync($"/api/StorageArea/Update/{storageArea.Id}", storageArea);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }

    }
}