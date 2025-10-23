using System.Net;
using System.Net.Http.Json;
using Xunit;
using Application.DTO;
using System.Linq;

using DataModel.Repository;
using WebApi.IntegrationTests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Domain.Model;

namespace WebApi.IntegrationTests.Tests
{
    public class DecisionIntegrationTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public DecisionIntegrationTests(IntegrationTestsWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();
                Utilities.ReinitializeDbForTests(db);
            }
        }
        [Fact]
        public async Task GetAllDecisions_ReturnsOkResponse()
        {
            var response = await _client.GetAsync("/api/VesselVisitNotification/Decision");
            response.EnsureSuccessStatusCode();
            var notifications = await response.Content.ReadFromJsonAsync<IEnumerable<DecisionDTO>>();
            Assert.NotNull(notifications);
            Assert.NotEmpty(notifications);
        }

        [Fact]
        public async Task GetDecisionById_NotFound()
        {
            var response = await _client.GetAsync("/api/VesselVisitNotification/DecisionByID/99999");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetDecisionById_Found()
        {
            var response = await _client.GetAsync("/api/VesselVisitNotification/Decision");
            response.EnsureSuccessStatusCode();
            var decisions = await response.Content.ReadFromJsonAsync<List<DecisionDTO>>();
            Assert.NotNull(decisions);
            Assert.NotEmpty(decisions);

            foreach (var d in decisions)
            {
                var getByIdResponse = await _client.GetAsync($"/api/VesselVisitNotification/DecisionByID/{d.Id}");
                Assert.Equal(HttpStatusCode.OK, getByIdResponse.StatusCode);
                var returned = await getByIdResponse.Content.ReadFromJsonAsync<DecisionDTO>();
                Assert.NotNull(returned);
                Assert.Equal(d.Id, returned.Id);
            }
        }
        
        [Fact]
        public async Task PostDecision_InvalidStatus_ReturnsBadRequest()
        {
            var listResp = await _client.GetAsync("/api/VesselVisitNotification");
            listResp.EnsureSuccessStatusCode();
            var visits = await listResp.Content.ReadFromJsonAsync<IEnumerable<VesselVisitNotificationDTO>>();
            var visitCode = visits!.First().Code;

            var dto = new DecisionDTO(0, "NotAStatus", "Whatever", 1, visitCode);

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification/Decision", dto);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>();
            Assert.Contains(errors!, s => s.Contains("Invalid Decision Status"));
        }

        [Fact]
        public async Task PostDecision_ApprovedWithNonExistingDock_ReturnsBadRequest()
        {
            var getList = await _client.GetAsync("/api/VesselVisitNotification");
            getList.EnsureSuccessStatusCode();
            var visitDtos = await getList.Content.ReadFromJsonAsync<List<VesselVisitNotificationDTO>>();
            var visitCode = visitDtos!.First().Code;

            var getByCode = await _client.GetAsync($"/api/VesselVisitNotification/ByCode/{visitCode}");
            getByCode.EnsureSuccessStatusCode();
            var visit = await getByCode.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();
            visit!.VisitStatus = VisitStatus.Submitted;
            var putResp = await _client.PutAsJsonAsync($"/api/VesselVisitNotification/Update/{visitCode}", visit);

            var dto = new DecisionDTO(0, "Approved", "NonExistingDock", 1, visitCode);

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification/Decision", dto);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>();
            Assert.Contains(errors!, s => s.Contains("Dock with name"));
        }

        [Fact]
        public async Task PostDecision_ApprovedWithExistingDock_ReturnsCreatedAndCorrectResponse()
        {
            var getList = await _client.GetAsync("/api/VesselVisitNotification");
            getList.EnsureSuccessStatusCode();
            var visitDtos = await getList.Content.ReadFromJsonAsync<List<VesselVisitNotificationDTO>>();
            var visitCode = visitDtos!.First().Code;

            var getByCode = await _client.GetAsync($"/api/VesselVisitNotification/ByCode/{visitCode}");
            getByCode.EnsureSuccessStatusCode();
            var visit = await getByCode.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();
            visit!.VisitStatus = VisitStatus.Submitted;
            await _client.PutAsJsonAsync($"/api/VesselVisitNotification/Update/{visitCode}", visit);

            var dto = new DecisionDTO(0, "Approved", "Dock A", 0, visitCode);

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification/Decision", dto);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var created = await response.Content.ReadFromJsonAsync<DecisionDTO>();
            Assert.NotNull(created);
            Assert.Equal("Dock A", created!.ResponseMessage);
            Assert.Equal("Approved", created.Status);
        }

        [Fact]
        public async Task PostDecision_WithNonExistingVisitCode_ReturnsConflict()
        {
            var dto = new DecisionDTO(0, "Rejected", "Some message", 1, "CODE_DOES_NOT_EXIST_999");

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification/Decision", dto);
            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>();
            Assert.Contains(errors!, s => s.Contains("Vessel Visit Notification not found."));
        }

        [Fact]
        public async Task PostDecision_NullBody_ReturnsBadRequest()
        {
            var emptyContent = new StringContent(string.Empty, System.Text.Encoding.UTF8, "application/json");
            var response = await _client.PostAsync("/api/VesselVisitNotification/Decision", emptyContent);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var body = await response.Content.ReadAsStringAsync();
            Assert.True(!string.IsNullOrEmpty(body));
        }

        [Fact]
        public async Task PostDecision_EmptyStatus_ReturnsBadRequest()
        {
            var listResp = await _client.GetAsync("/api/VesselVisitNotification");
            listResp.EnsureSuccessStatusCode();
            var visits = await listResp.Content.ReadFromJsonAsync<IEnumerable<VesselVisitNotificationDTO>>();
            var visitCode = visits!.First().Code;

            var dto = new DecisionDTO(0, "", "Some response", 1, visitCode);

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification/Decision", dto);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>();
            Assert.Contains(errors!, s => s.Contains("Invalid Decision Status") || s.Contains("Invalid Decision"));
        }

        [Fact]
        public async Task PostDecision_ApprovedWithEmptyResponse_ReturnsBadRequest()
        {
            var getList = await _client.GetAsync("/api/VesselVisitNotification");
            getList.EnsureSuccessStatusCode();
            var visitDtos = await getList.Content.ReadFromJsonAsync<List<VesselVisitNotificationDTO>>();
            var visitCode = visitDtos!.First().Code;

            var getByCode = await _client.GetAsync($"/api/VesselVisitNotification/ByCode/{visitCode}");
            getByCode.EnsureSuccessStatusCode();
            var visit = await getByCode.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();
            visit!.VisitStatus = VisitStatus.Submitted;
            await _client.PutAsJsonAsync($"/api/VesselVisitNotification/Update/{visitCode}", visit);

            var dto = new DecisionDTO(0, "Approved", "", 1, visitCode);

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification/Decision", dto);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>();
            Assert.Contains(errors!, s => s.Contains("Dock with name") || s.Contains("Dock"));
        }

    }
}