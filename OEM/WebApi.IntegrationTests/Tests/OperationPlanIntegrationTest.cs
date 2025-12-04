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

namespace WebApi.IntegrationTests.Tests;

public class OperationPlanIntegrationTest : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public OperationPlanIntegrationTest(IntegrationTestsWebApplicationFactory<Program> factory)
    {
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<OEMContext>();
            WebApi.IntegrationTests.Helpers.Utilities.ReinitializeDbForTests(db);
        }
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetAllOperationPlans_ReturnsOkAndList()
    {
        var response = await _client.GetAsync("/api/OperationPlan");
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var operationPlans = await response.Content.ReadFromJsonAsync<List<OperationPlanDTO>>();
        Assert.NotNull(operationPlans);
        Assert.True(operationPlans.Count > 0);
    }

    [Fact]
    public async Task GetOperationPlanById_ExistingId_ReturnsOkAndCorrectId()
    {
        var getAllResponse = await _client.GetAsync("/api/OperationPlan");
        getAllResponse.EnsureSuccessStatusCode();
        var allPlans = await getAllResponse.Content.ReadFromJsonAsync<List<OperationPlanDTO>>();
        Assert.NotNull(allPlans);
        Assert.NotEmpty(allPlans);

        var existingPlan = allPlans.First();
        var response = await _client.GetAsync($"/api/OperationPlan/ByID/{existingPlan.Id}");
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var operationPlan = await response.Content.ReadFromJsonAsync<OperationPlanDTO>();
        Assert.NotNull(operationPlan);
        Assert.Equal(existingPlan.Id, operationPlan!.Id);
    }

    [Theory]
    [InlineData(999)]
    [InlineData(-1)]
    public async Task GetOperationPlanById_NotFound_ReturnsNotFound(long id)
    {
        var response = await _client.GetAsync($"/api/OperationPlan/ByID/{id}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData("Admin User")]
    [InlineData("Planner User")]
    public async Task GetOperationPlansByAuthor_ReturnsOkAndList(string author)
    {
        var response = await _client.GetAsync($"/api/OperationPlan/ByAuthor/{author}");
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var operationPlans = await response.Content.ReadFromJsonAsync<List<OperationPlanDTO>>();
        Assert.NotNull(operationPlans);
        Assert.NotEmpty(operationPlans);
        Assert.All(operationPlans, op => Assert.Equal(author, op.Author));
    }

    [Fact]
    public async Task GetOperationPlansByAuthor_NotFound_ReturnsNotFound()
    {
        var response = await _client.GetAsync("/api/OperationPlan/ByAuthor/NonExistentAuthor");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData("Greedy Algorithm")]
    [InlineData("Heuristic Algorithm")]
    public async Task GetOperationPlansByAlgorithm_ReturnsOkAndList(string algorithm)
    {
        var response = await _client.GetAsync($"/api/OperationPlan/ByAlgorithm/{algorithm}");
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var operationPlans = await response.Content.ReadFromJsonAsync<List<OperationPlanDTO>>();
        Assert.NotNull(operationPlans);
        Assert.NotEmpty(operationPlans);
        Assert.All(operationPlans, op => Assert.Equal(algorithm, op.Algorithm));
    }

    [Fact]
    public async Task GetOperationPlansByAlgorithm_NotFound_ReturnsNotFound()
    {
        var response = await _client.GetAsync("/api/OperationPlan/ByAlgorithm/NonExistentAlgorithm");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetOperationPlanByTargetDay_ReturnsOkAndCorrectPlan()
    {
        var today = DateTime.UtcNow.Date;
        var response = await _client.GetAsync($"/api/OperationPlan/ByTargetDay/{today:yyyy-MM-dd}");
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var operationPlan = await response.Content.ReadFromJsonAsync<OperationPlanDTO>();
        Assert.NotNull(operationPlan);
        Assert.Equal(today, operationPlan!.TargetDay.Date);
    }

    [Fact]
    public async Task GetOperationPlanByTargetDay_NotFound_ReturnsNotFound()
    {
        var futureDate = DateTime.UtcNow.Date.AddYears(1);
        var response = await _client.GetAsync($"/api/OperationPlan/ByTargetDay/{futureDate:yyyy-MM-dd}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PostOperationPlan_CreatesNewOperationPlan_ReturnsCreated()
    {
        var futureDate = DateTime.UtcNow.Date.AddDays(10);
        var newOperationPlan = new
        {
            OperationList = new[]
            {
                new
                {
                    VesselName = "Test Vessel",
                    ArrivalTime = futureDate.AddHours(8),
                    DepartureTime = futureDate.AddHours(12),
                    Cranes = new[] { "Crane T1", "Crane T2" },
                    StaffMembers = new[] { "Staff T1", "Staff T2" }
                }
            },
            TargetDay = futureDate,
            Author = "Test Author",
            Algorithm = "Test Algorithm"
        };

        var response = await _client.PostAsJsonAsync("/api/OperationPlan", newOperationPlan);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<OperationPlanDTO>();
        Assert.NotNull(created);
        Assert.Equal(newOperationPlan.Author, created!.Author);
        Assert.Equal(newOperationPlan.Algorithm, created.Algorithm);
        Assert.Equal(newOperationPlan.TargetDay.Date, created.TargetDay.Date);
    }

    [Fact]
    public async Task PostOperationPlan_WithExistingTargetDay_ReturnsConflict()
    {
        var today = DateTime.UtcNow.Date;
        var duplicateOperationPlan = new
        {
            OperationList = new[]
            {
                new
                {
                    VesselName = "Duplicate Vessel",
                    ArrivalTime = today.AddHours(15),
                    DepartureTime = today.AddHours(18),
                    Cranes = new[] { "Crane X1" },
                    StaffMembers = new[] { "Staff X1" }
                }
            },
            TargetDay = today,
            Author = "Duplicate Author",
            Algorithm = "Duplicate Algorithm"
        };

        var response = await _client.PostAsJsonAsync("/api/OperationPlan", duplicateOperationPlan);
        Assert.True(response.StatusCode == HttpStatusCode.Conflict || response.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PostOperationPlan_WithNullOperationList_ReturnsBadRequest()
    {
        var futureDate = DateTime.UtcNow.Date.AddDays(15);
        var invalidOperationPlan = new
        {
            OperationList = (object?)null,
            TargetDay = futureDate,
            Author = "Test Author",
            Algorithm = "Test Algorithm"
        };

        var response = await _client.PostAsJsonAsync("/api/OperationPlan", invalidOperationPlan);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostOperationPlan_WithEmptyOperationList_ReturnsBadRequest()
    {
        var futureDate = DateTime.UtcNow.Date.AddDays(16);
        var invalidOperationPlan = new
        {
            OperationList = Array.Empty<object>(),
            TargetDay = futureDate,
            Author = "Test Author",
            Algorithm = "Test Algorithm"
        };

        var response = await _client.PostAsJsonAsync("/api/OperationPlan", invalidOperationPlan);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostOperationPlan_WithEmptyAuthor_ReturnsBadRequest()
    {
        var futureDate = DateTime.UtcNow.Date.AddDays(17);
        var invalidOperationPlan = new
        {
            OperationList = new[]
            {
                new
                {
                    VesselName = "Test Vessel",
                    ArrivalTime = futureDate.AddHours(8),
                    DepartureTime = futureDate.AddHours(12),
                    Cranes = new[] { "Crane T1" },
                    StaffMembers = new[] { "Staff T1" }
                }
            },
            TargetDay = futureDate,
            Author = "",
            Algorithm = "Test Algorithm"
        };

        var response = await _client.PostAsJsonAsync("/api/OperationPlan", invalidOperationPlan);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostOperationPlan_WithEmptyAlgorithm_ReturnsBadRequest()
    {
        var futureDate = DateTime.UtcNow.Date.AddDays(18);
        var invalidOperationPlan = new
        {
            OperationList = new[]
            {
                new
                {
                    VesselName = "Test Vessel",
                    ArrivalTime = futureDate.AddHours(8),
                    DepartureTime = futureDate.AddHours(12),
                    Cranes = new[] { "Crane T1" },
                    StaffMembers = new[] { "Staff T1" }
                }
            },
            TargetDay = futureDate,
            Author = "Test Author",
            Algorithm = ""
        };

        var response = await _client.PostAsJsonAsync("/api/OperationPlan", invalidOperationPlan);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostOperationPlan_WithInvalidVesselName_ReturnsBadRequest()
    {
        var futureDate = DateTime.UtcNow.Date.AddDays(19);
        var invalidOperationPlan = new
        {
            OperationList = new[]
            {
                new
                {
                    VesselName = "",
                    ArrivalTime = futureDate.AddHours(8),
                    DepartureTime = futureDate.AddHours(12),
                    Cranes = new[] { "Crane T1" },
                    StaffMembers = new[] { "Staff T1" }
                }
            },
            TargetDay = futureDate,
            Author = "Test Author",
            Algorithm = "Test Algorithm"
        };

        var response = await _client.PostAsJsonAsync("/api/OperationPlan", invalidOperationPlan);
        Assert.True(response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task PostOperationPlan_WithArrivalAfterDeparture_ReturnsBadRequest()
    {
        var futureDate = DateTime.UtcNow.Date.AddDays(20);
        var invalidOperationPlan = new
        {
            OperationList = new[]
            {
                new
                {
                    VesselName = "Test Vessel",
                    ArrivalTime = futureDate.AddHours(12),
                    DepartureTime = futureDate.AddHours(8),
                    Cranes = new[] { "Crane T1" },
                    StaffMembers = new[] { "Staff T1" }
                }
            },
            TargetDay = futureDate,
            Author = "Test Author",
            Algorithm = "Test Algorithm"
        };

        var response = await _client.PostAsJsonAsync("/api/OperationPlan", invalidOperationPlan);
        Assert.True(response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task PostOperationPlan_WithEmptyCranes_ReturnsBadRequest()
    {
        var futureDate = DateTime.UtcNow.Date.AddDays(21);
        var invalidOperationPlan = new
        {
            OperationList = new[]
            {
                new
                {
                    VesselName = "Test Vessel",
                    ArrivalTime = futureDate.AddHours(8),
                    DepartureTime = futureDate.AddHours(12),
                    Cranes = Array.Empty<string>(),
                    StaffMembers = new[] { "Staff T1" }
                }
            },
            TargetDay = futureDate,
            Author = "Test Author",
            Algorithm = "Test Algorithm"
        };

        var response = await _client.PostAsJsonAsync("/api/OperationPlan", invalidOperationPlan);
        Assert.True(response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task PostOperationPlan_WithEmptyStaffMembers_ReturnsBadRequest()
    {
        var futureDate = DateTime.UtcNow.Date.AddDays(22);
        var invalidOperationPlan = new
        {
            OperationList = new[]
            {
                new
                {
                    VesselName = "Test Vessel",
                    ArrivalTime = futureDate.AddHours(8),
                    DepartureTime = futureDate.AddHours(12),
                    Cranes = new[] { "Crane T1" },
                    StaffMembers = Array.Empty<string>()
                }
            },
            TargetDay = futureDate,
            Author = "Test Author",
            Algorithm = "Test Algorithm"
        };

        var response = await _client.PostAsJsonAsync("/api/OperationPlan", invalidOperationPlan);
        Assert.True(response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task PostOperationPlan_WithNullData_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/OperationPlan", (OperationPlanDTO?)null);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateOperationPlan_UpdatesSuccessfully_ReturnsOk()
    {
        var getAllResponse = await _client.GetAsync("/api/OperationPlan");
        getAllResponse.EnsureSuccessStatusCode();
        var allPlans = await getAllResponse.Content.ReadFromJsonAsync<List<OperationPlanDTO>>();
        Assert.NotNull(allPlans);
        Assert.NotEmpty(allPlans);

        var existingPlan = allPlans.First();
        var updateDto = new
        {
            OperationList = new[]
            {
                new
                {
                    VesselName = "Updated Vessel",
                    ArrivalTime = existingPlan.TargetDay.AddHours(10),
                    DepartureTime = existingPlan.TargetDay.AddHours(15),
                    Cranes = new[] { "Updated Crane" },
                    StaffMembers = new[] { "Updated Staff" }
                }
            },
            TargetDay = existingPlan.TargetDay,
            Author = "Updated Author",
            Algorithm = "Updated Algorithm"
        };

        var response = await _client.PutAsJsonAsync($"/api/OperationPlan/Update/{existingPlan.Id}", updateDto);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var getResponse = await _client.GetAsync($"/api/OperationPlan/ByID/{existingPlan.Id}");
        var updated = await getResponse.Content.ReadFromJsonAsync<OperationPlanDTO>();
        Assert.NotNull(updated);
        Assert.Equal("Updated Author", updated!.Author);
        Assert.Equal("Updated Algorithm", updated.Algorithm);
    }

    [Fact]
    public async Task UpdateOperationPlan_WithNonExistentId_ReturnsBadRequest()
    {
        var futureDate = DateTime.UtcNow.Date.AddDays(25);
        var updateDto = new
        {
            OperationList = new[]
            {
                new
                {
                    VesselName = "Test Vessel",
                    ArrivalTime = futureDate.AddHours(8),
                    DepartureTime = futureDate.AddHours(12),
                    Cranes = new[] { "Crane T1" },
                    StaffMembers = new[] { "Staff T1" }
                }
            },
            TargetDay = futureDate,
            Author = "Test Author",
            Algorithm = "Test Algorithm"
        };

        var response = await _client.PutAsJsonAsync("/api/OperationPlan/Update/999", updateDto);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateOperationPlan_WithPastTargetDay_ReturnsBadRequest()
    {
        var getAllResponse = await _client.GetAsync("/api/OperationPlan");
        getAllResponse.EnsureSuccessStatusCode();
        var allPlans = await getAllResponse.Content.ReadFromJsonAsync<List<OperationPlanDTO>>();
        Assert.NotNull(allPlans);
        Assert.NotEmpty(allPlans);

        var existingPlan = allPlans.First();
        var pastDate = DateTime.UtcNow.Date.AddDays(-5);
        var updateDto = new
        {
            OperationList = new[]
            {
                new
                {
                    VesselName = "Test Vessel",
                    ArrivalTime = pastDate.AddHours(8),
                    DepartureTime = pastDate.AddHours(12),
                    Cranes = new[] { "Crane T1" },
                    StaffMembers = new[] { "Staff T1" }
                }
            },
            TargetDay = pastDate,
            Author = "Test Author",
            Algorithm = "Test Algorithm"
        };

        var response = await _client.PutAsJsonAsync($"/api/OperationPlan/Update/{existingPlan.Id}", updateDto);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateOperationPlan_WithExistingTargetDay_ReturnsConflict()
    {
        var getAllResponse = await _client.GetAsync("/api/OperationPlan");
        getAllResponse.EnsureSuccessStatusCode();
        var allPlans = await getAllResponse.Content.ReadFromJsonAsync<List<OperationPlanDTO>>();
        Assert.NotNull(allPlans);
        Assert.True(allPlans.Count >= 2);

        var firstPlan = allPlans[0];
        var secondPlan = allPlans[1];

        var updateDto = new
        {
            OperationList = new[]
            {
                new
                {
                    VesselName = "Test Vessel",
                    ArrivalTime = secondPlan.TargetDay.AddHours(8),
                    DepartureTime = secondPlan.TargetDay.AddHours(12),
                    Cranes = new[] { "Crane T1" },
                    StaffMembers = new[] { "Staff T1" }
                }
            },
            TargetDay = secondPlan.TargetDay,
            Author = "Test Author",
            Algorithm = "Test Algorithm"
        };

        var response = await _client.PutAsJsonAsync($"/api/OperationPlan/Update/{firstPlan.Id}", updateDto);
        Assert.True(response.StatusCode == HttpStatusCode.Conflict || response.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateOperationPlan_WithEmptyAuthor_ReturnsBadRequest()
    {
        var getAllResponse = await _client.GetAsync("/api/OperationPlan");
        getAllResponse.EnsureSuccessStatusCode();
        var allPlans = await getAllResponse.Content.ReadFromJsonAsync<List<OperationPlanDTO>>();
        Assert.NotNull(allPlans);
        Assert.NotEmpty(allPlans);

        var existingPlan = allPlans.First();
        var updateDto = new
        {
            OperationList = new[]
            {
                new
                {
                    VesselName = "Test Vessel",
                    ArrivalTime = existingPlan.TargetDay.AddHours(8),
                    DepartureTime = existingPlan.TargetDay.AddHours(12),
                    Cranes = new[] { "Crane T1" },
                    StaffMembers = new[] { "Staff T1" }
                }
            },
            TargetDay = existingPlan.TargetDay,
            Author = "",
            Algorithm = "Test Algorithm"
        };

        var response = await _client.PutAsJsonAsync($"/api/OperationPlan/Update/{existingPlan.Id}", updateDto);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateOperationPlan_WithNullData_ReturnsBadRequest()
    {
        var response = await _client.PutAsJsonAsync("/api/OperationPlan/Update/1", (OperationPlanDTO?)null);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostOperationPlan_WithMultipleOperationEntries_ReturnsCreated()
    {
        var futureDate = DateTime.UtcNow.Date.AddDays(30);
        var newOperationPlan = new
        {
            OperationList = new[]
            {
                new
                {
                    VesselName = "Multi Vessel 1",
                    ArrivalTime = futureDate.AddHours(8),
                    DepartureTime = futureDate.AddHours(12),
                    Cranes = new[] { "Crane M1", "Crane M2" },
                    StaffMembers = new[] { "Staff M1", "Staff M2" }
                },
                new
                {
                    VesselName = "Multi Vessel 2",
                    ArrivalTime = futureDate.AddHours(13),
                    DepartureTime = futureDate.AddHours(17),
                    Cranes = new[] { "Crane M3" },
                    StaffMembers = new[] { "Staff M3", "Staff M4" }
                },
                new
                {
                    VesselName = "Multi Vessel 3",
                    ArrivalTime = futureDate.AddHours(18),
                    DepartureTime = futureDate.AddHours(22),
                    Cranes = new[] { "Crane M4", "Crane M5" },
                    StaffMembers = new[] { "Staff M5" }
                }
            },
            TargetDay = futureDate,
            Author = "Multi Test Author",
            Algorithm = "Multi Test Algorithm"
        };

        var response = await _client.PostAsJsonAsync("/api/OperationPlan", newOperationPlan);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<OperationPlanDTO>();
        Assert.NotNull(created);
        Assert.NotNull(created!.OperationList);
        Assert.Equal(3, created.OperationList.Count);
    }
}
