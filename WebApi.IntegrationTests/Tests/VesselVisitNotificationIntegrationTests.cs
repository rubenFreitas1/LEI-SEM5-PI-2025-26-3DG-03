using System;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
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

    public class VesselVisitNotificationIntegrationTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public VesselVisitNotificationIntegrationTests(IntegrationTestsWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();
                Utilities.ReinitializeDbForTests(db);
            }
        }

        [Fact]
        public async Task GetAllVesselVisitNotifications_ReturnsOkResponse()
        {
            var response = await _client.GetAsync("/api/VesselVisitNotification");
            response.EnsureSuccessStatusCode();
            var notifications = await response.Content.ReadFromJsonAsync<IEnumerable<VesselVisitNotificationDTO>>();
            Assert.NotNull(notifications);
            Assert.NotEmpty(notifications);
        }

        [Fact]
        public async Task GetVesselVisitNotificationById_Found()
        {
            var response = await _client.GetAsync("/api/VesselVisitNotification");
            response.EnsureSuccessStatusCode();
            var notifications = await response.Content.ReadFromJsonAsync<IEnumerable<VesselVisitNotificationDTO>>();
            Assert.NotNull(notifications);
            Assert.NotEmpty(notifications);
            foreach (var notif in notifications)
            {
                var getByIdResponse = await _client.GetAsync($"/api/VesselVisitNotification/ById/{notif.Id}");
                getByIdResponse.EnsureSuccessStatusCode();
                var n = await getByIdResponse.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();
                Assert.NotNull(n);
                Assert.Equal(notif.Id, n.Id);
            }
        }

        [Theory]
        [InlineData(09999)]
        [InlineData(12345)]
        public async Task GetVesselVisitNotificationById_NotFound(int id)
        {
            var response = await _client.GetAsync($"/api/VesselVisitNotification/ById/{id}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("2025-PA-000001")]
        [InlineData("2025-PA-000002")]
        [InlineData("2025-PA-000003")]
        [InlineData("2025-PA-000004")]
        public async Task GetVesselVisitNotificationByCode_Found(string code)
        {
            var response = await _client.GetAsync($"/api/VesselVisitNotification/ByCode/{code}");
            response.EnsureSuccessStatusCode();
            var notification = await response.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();
            Assert.NotNull(notification);
            Assert.Equal(code, notification.Code);
        }


        [Theory]
        [InlineData("INVALID-CODE-001")]
        [InlineData("UNKNOWN-2025-PA-999999")]
        [InlineData("2024-XX-000123")]
        public async Task GetVesselVisitNotificationByCode_NotFound(string code)
        {
            var response = await _client.GetAsync($"/api/VesselVisitNotification/ByCode/{code}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }


        [Fact]
        public async Task GetVesselVisitNotificationByOrg_ReturnsOkResponse()
        {
            var orgCode = "AAA1";
            var responseOrg = await _client.GetAsync($"/api/ShippingAgentOrganization/ByCode/{orgCode}");
            responseOrg.EnsureSuccessStatusCode();
            var organization = await responseOrg.Content.ReadFromJsonAsync<ShippingAgentOrganizationDTO>();


            var response = await _client.GetAsync($"/api/VesselVisitNotification/ByOrg/{orgCode}");
            response.EnsureSuccessStatusCode();
            var notifications = await response.Content.ReadFromJsonAsync<IEnumerable<VesselVisitNotificationDTO>>();
            Assert.NotNull(notifications);
            Assert.NotEmpty(notifications);
            foreach (var notif in notifications)
            {
                var responseRepresentative = await _client.GetAsync($"/api/Representative/ByCitizenId/{notif.RepresentativeCitizenID}");
                responseRepresentative.EnsureSuccessStatusCode();
                var representative = await responseRepresentative.Content.ReadFromJsonAsync<RepresentativeDTO>();
                Assert.NotNull(representative);

                Assert.Equal(representative.OrganizationName, organization!.LegalName);
            }
        }

        [Theory]
        [InlineData("NONEXISTENTORG")]
        [InlineData("ZZZ9")]
        public async Task GetVesselVisitNotificationByOrg_NotFound(string orgCode)
        {
            var response = await _client.GetAsync($"/api/VesselVisitNotification/ByOrg/{orgCode}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var notifications = await response.Content.ReadFromJsonAsync<IEnumerable<VesselVisitNotificationDTO>>();
            Assert.NotNull(notifications);
            Assert.Empty(notifications);
        }

        [Fact]
        public async Task GetVesselVisitNotificationsByVesselIMO_Org_ReturnsOkResponse()
        {
            var vesselIMO = "9811000";
            var orgCode = "AAA1";

            var response = await _client.GetAsync($"/api/VesselVisitNotification/ByVesselIMO_Org/{vesselIMO}/{orgCode}");
            response.EnsureSuccessStatusCode();
            var notifications = await response.Content.ReadFromJsonAsync<IEnumerable<VesselVisitNotificationDTO>>();
            Assert.NotNull(notifications);
            Assert.NotEmpty(notifications);
            foreach (var notif in notifications)
            {
                Assert.Equal(vesselIMO, notif.VesselIMO);
            }
        }

        [Theory]
        [InlineData("0000000", "AAA1")]
        [InlineData("9811000", "NONEXISTENTORG")]
        public async Task GetVesselVisitNotificationsByVesselIMO_Org_NotFound(string vesselIMO, string orgCode)
        {
            var response = await _client.GetAsync($"/api/VesselVisitNotification/ByVesselIMO_Org/{vesselIMO}/{orgCode}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var notifications = await response.Content.ReadFromJsonAsync<IEnumerable<VesselVisitNotificationDTO>>();
            Assert.NotNull(notifications);
            Assert.Empty(notifications);
        }

        [Fact]
        public async Task GetVesselVisitNotificationsByDateRange_Org_ReturnsOkResponse()
        {
            var now = DateTime.UtcNow;
            var eta2 = now.AddDays(10);
            var orgCode = "AAA1";

            var response = await _client.GetAsync($"/api/VesselVisitNotification/ByDateRange_Org/{now:yyyy-MM-dd}/{eta2:yyyy-MM-dd}/{orgCode}");
            response.EnsureSuccessStatusCode();
            var notifications = await response.Content.ReadFromJsonAsync<IEnumerable<VesselVisitNotificationDTO>>();
            Assert.NotNull(notifications);
            Assert.NotEmpty(notifications);
            foreach (var notif in notifications)
            {
                Assert.InRange(notif.Eta, now, eta2);
            }
        }

        [Fact]
        public async Task GetVesselVisitNotificationsByDateRange_Org_NotFound()
        {
            var startDate = new DateTime(2000, 1, 1);
            var endDate = new DateTime(2000, 12, 31);
            var orgCode = "AAA1";

            var response = await _client.GetAsync($"/api/VesselVisitNotification/ByDateRange_Org/{startDate:yyyy-MM-dd}/{endDate:yyyy-MM-dd}/{orgCode}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var notifications = await response.Content.ReadFromJsonAsync<IEnumerable<VesselVisitNotificationDTO>>();
            Assert.NotNull(notifications);
            Assert.Empty(notifications);
        }

        [Theory]
        [InlineData("CID1")]
        [InlineData("CID2")]
        [InlineData("CID3")]
        [InlineData("CID4")]
        public async Task GetVesselVisitNotificationsByRepresentative(string citizenId)
        {
            var response = await _client.GetAsync($"/api/VesselVisitNotification/ByRepresentative/{citizenId}");
            response.EnsureSuccessStatusCode();
            var notifications = await response.Content.ReadFromJsonAsync<IEnumerable<VesselVisitNotificationDTO>>();
            Assert.NotNull(notifications);
            Assert.NotEmpty(notifications);
            foreach (var notif in notifications)
            {
                Assert.Equal(citizenId, notif.RepresentativeCitizenID);
            }
        }

        [Theory]
        [InlineData("NONEXISTENTCID")]
        [InlineData("CID999")]
        [InlineData("CID000")]
        public async Task GetVesselVisitNotificationsByRepresentative_NotFound(string citizenId)
        {
            var response = await _client.GetAsync($"/api/VesselVisitNotification/ByRepresentative/{citizenId}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var notifications = await response.Content.ReadFromJsonAsync<IEnumerable<VesselVisitNotificationDTO>>();
            Assert.NotNull(notifications);
            Assert.Empty(notifications);
        }
        [Theory]
        [InlineData("AAA1")]
        [InlineData("BBB2")]
        public async Task GetVesselVisitNotificationsByStatus_Org_ReturnsOkResponse(string orgCode)
        {
            var status = VisitStatus.InProgress;

            var response = await _client.GetAsync($"/api/VesselVisitNotification/ByStatus_Org/{status}/{orgCode}");
            response.EnsureSuccessStatusCode();
            var notifications = await response.Content.ReadFromJsonAsync<IEnumerable<VesselVisitNotificationDTO>>();
            Assert.NotNull(notifications);
            Assert.NotEmpty(notifications);
            foreach (var notif in notifications)
            {
                Assert.Equal(status, notif.VisitStatus);
            }
        }

        [Theory]
        [InlineData("AAA1")]
        [InlineData("NONEXISTENTORG")]
        public async Task GetVesselVisitNotificationsByStatus_Org_NotFound(string orgCode)
        {
            var status = VisitStatus.Approved;

            var response = await _client.GetAsync($"/api/VesselVisitNotification/ByStatus_Org/{status}/{orgCode}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var notifications = await response.Content.ReadFromJsonAsync<IEnumerable<VesselVisitNotificationDTO>>();
            Assert.NotNull(notifications);
            Assert.Empty(notifications);
        }

        private static VesselVisitNotificationDTO BuildValidDto()
        {
            var now = DateTime.UtcNow;
            return new VesselVisitNotificationDTO(0, string.Empty, "9811000", "CID1", now.AddDays(20), now.AddDays(22), new List<CargoManifestDTO>
            {
                new CargoManifestDTO
                {
                    ManifestType = CargoManifestType.Loading,
                    Entries = new List<CargoManifestEntryDTO>
                    {
                        new CargoManifestEntryDTO { ContainerNumber = "ABCU1112222", Row = 1, Bay = 1, Tier = 1, StorageAreaCode = "WH001" }
                    }
                }
            }, CargoType.Container, 100.0, new List<CrewMemberDTO>
            {
                new CrewMemberDTO { Name = "Captain Test", CitizenID = "CPTTEST", Rank = CrewRank.Captain, Nationality = "PT" }
            }, VisitStatus.InProgress);
        }

        [Fact]
        public async Task Post_ValidDto_ReturnsCreated()
        {
            var dto = BuildValidDto();

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var created = await response.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();
            Assert.NotNull(created);
            Assert.True(created.Id > 0);
            Assert.Equal(dto.VesselIMO, created.VesselIMO);
        }

        [Theory]
        [InlineData("0000000")]
        [InlineData("1234567")]
        public async Task Post_MissingVessel_ReturnsBadRequest(string vesselIMO)
        {
            var dto = BuildValidDto();
            dto.VesselIMO = vesselIMO;

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("Vessel Record not found"));
        }

        [Theory]
        [InlineData("NOAREA")]
        [InlineData("INVALID")]
        public async Task Post_StorageAreaNotFound_ReturnsBadRequest(string strorageAreaCode)
        {
            var dto = BuildValidDto();
            dto.CargoManifests![0].Entries![0].StorageAreaCode = strorageAreaCode;

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains($"Storage area with code '{strorageAreaCode}' not found"));
        }

        [Fact]
        public async Task Post_DuplicateContainerInSameManifest_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            dto.CargoManifests![0].Entries!.Add(new CargoManifestEntryDTO { ContainerNumber = "ABCU1112222", Row = 2, Bay = 1, Tier = 1, StorageAreaCode = "WH001" });

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("Duplicate container detected"));
        }

        [Fact]
        public async Task Post_EmptyContainerNumber_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            dto.CargoManifests![0].Entries![0].ContainerNumber = string.Empty;

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("Container number cannot be empty"));
        }

        [Fact]
        public async Task Post_ETA_EarlierThanETD_Validation()
        {
            var dto = BuildValidDto();
            dto.Eta = DateTime.UtcNow.AddDays(5);
            dto.Etd = DateTime.UtcNow.AddDays(4);

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("ETA must be earlier") || e.Contains("ETA must be earlier than ETD"));
        }

        [Fact]
        public async Task Post_OverlappingVisit_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            var r1 = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);
            Assert.Equal(HttpStatusCode.Created, r1.StatusCode);

            var dto2 = BuildValidDto();
            dto2.Eta = dto.Eta.AddDays(0); 
            dto2.Etd = dto.Etd.AddDays(0);

            var r2 = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto2);
            Assert.Equal(HttpStatusCode.BadRequest, r2.StatusCode);
            var errors = await r2.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.ToLowerInvariant().Contains("overlapping visit"));
        }

        [Fact]
        public async Task Post_RepresentativeNotFound_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            dto.RepresentativeCitizenID = "UNKNOWN";

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("Representative not found"));
        }

        [Fact]
        public async Task Post_MissingCaptain_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            dto.CrewMembers = new List<CrewMemberDTO> { new CrewMemberDTO { Name = "Officer Only", CitizenID = "OFF1", Rank = CrewRank.Officer, Nationality = "PT" } };

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("There must be at least one crew member with the rank of Captain") || e.Contains("must be at least one crew member with the rank of Captain"));
        }

        [Fact]
        public async Task Post_DuplicateCaptain_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            dto.CrewMembers = new List<CrewMemberDTO>
            {
                new CrewMemberDTO { Name = "Captain A", CitizenID = "CAP1", Rank = CrewRank.Captain, Nationality = "PT" },
                new CrewMemberDTO { Name = "Captain B", CitizenID = "CAP2", Rank = CrewRank.Captain, Nationality = "PT" }
            };

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("There cannot be more than one crew member with the rank of Captain") || e.Contains("more than one crew member with the rank of Captain"));
        }

        [Fact]
        public async Task Post_HazardousWithoutSafetyOfficer_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            dto.CargoType = CargoType.Hazardous;
            dto.CrewMembers = new List<CrewMemberDTO> { new CrewMemberDTO { Name = "Captain Only", CitizenID = "CPTX", Rank = CrewRank.Captain, Nationality = "PT" } };

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("There must be at least one crew member with the rank of Safety Officer") || e.Contains("Safety Officer"));
        }

        [Fact]
        public async Task Post_MultipleLoadingManifests_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            dto.CargoManifests!.Add(new CargoManifestDTO
            {
                ManifestType = CargoManifestType.Loading,
                Entries = new List<CargoManifestEntryDTO>
                {
                    new CargoManifestEntryDTO { ContainerNumber = "ABCU9999999", Row = 1, Bay = 2, Tier = 1, StorageAreaCode = "WH001" }
                }
            });

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("Cargo manifests cannot contain more than one loading manifest") || e.Contains("more than one loading"));
        }

        [Fact]
        public async Task Post_NegativeVolume_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            dto.Volume = -10.0;

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("Volume cannot be negative") || e.Contains("Volume cannot be"));
        }

        [Fact]
        public async Task Post_DuplicateCrewCitizenId_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            dto.CrewMembers = new List<CrewMemberDTO>
            {
                new CrewMemberDTO { Name = "Captain", CitizenID = "DUP1", Rank = CrewRank.Captain, Nationality = "PT" },
                new CrewMemberDTO { Name = "Officer", CitizenID = "DUP1", Rank = CrewRank.Officer, Nationality = "PT" }
            };

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("Duplicate crew member citizen ID") || e.Contains("Duplicate crew member"));
        }

        [Fact]
        public async Task Post_InvalidContainerFormat_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            dto.CargoManifests![0].Entries![0].ContainerNumber = "INVALID123"; // bad format

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("Invalid container in cargo manifest entry") || e.Contains("Container number must have 4 uppercase letters"));
        }

        [Fact]
        public async Task Put_UpdateValid_ReturnsOk()
        {
            var dto = BuildValidDto();
            var createResp = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);
            Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
            var created = await createResp.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();
            Assert.NotNull(created);

            created!.Volume = 200.0;
            created.Eta = created.Eta.AddDays(1);
            created.Etd = created.Etd.AddDays(1);
            created.CargoType = CargoType.General;

            var updResp = await _client.PutAsJsonAsync($"/api/VesselVisitNotification/Update/{created.Code}", created);
            Assert.Equal(HttpStatusCode.OK, updResp.StatusCode);

            // verify
            var getResp = await _client.GetAsync($"/api/VesselVisitNotification/ByCode/{created.Code}");
            getResp.EnsureSuccessStatusCode();
            var updated = await getResp.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();
            Assert.NotNull(updated);
            Assert.Equal(200.0, updated!.Volume);
        }

        [Fact]
        public async Task Put_ChangeCode_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            var createResp = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);
            Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
            var created = await createResp.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();
            Assert.NotNull(created);

            var originalCode = created!.Code;
            created.Code = "2025-PA-999999";
            var updResp = await _client.PutAsJsonAsync($"/api/VesselVisitNotification/Update/{originalCode}", created);
            Assert.Equal(HttpStatusCode.BadRequest, updResp.StatusCode);
            var errors = await updResp.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("Visit code cannot be changed") || e.Contains("Visit code"));
        }

        [Fact]
        public async Task Put_MissingVessel_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            var createResp = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);
            Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
            var created = await createResp.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();

            created!.VesselIMO = "0000000"; 
            var updResp = await _client.PutAsJsonAsync($"/api/VesselVisitNotification/Update/{created.Code}", created);
            Assert.Equal(HttpStatusCode.BadRequest, updResp.StatusCode);
            var errors = await updResp.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("Vessel Record not found") || e.Contains("Vessel"));
        }

        [Fact]
        public async Task Put_OverlappingVisit_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            var r1 = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);
            Assert.Equal(HttpStatusCode.Created, r1.StatusCode);
            var created1 = await r1.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();

            var dto2 = BuildValidDto();
            dto2.Eta = dto.Eta.AddDays(5);
            dto2.Etd = dto.Etd.AddDays(5);
            var r2 = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto2);
            Assert.Equal(HttpStatusCode.Created, r2.StatusCode);
            var created2 = await r2.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();

            created2!.Eta = created1!.Eta.AddDays(0);
            created2.Etd = created1.Etd.AddHours(1);

            var updResp = await _client.PutAsJsonAsync($"/api/VesselVisitNotification/Update/{created2.Code}", created2);
            Assert.Equal(HttpStatusCode.BadRequest, updResp.StatusCode);
            var errors = await updResp.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.ToLowerInvariant().Contains("overlapping visit") || e.ToLowerInvariant().Contains("overlap"));
        }

        [Fact]
        public async Task Put_MultipleLoadingManifests_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            var createResp = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);
            Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
            var created = await createResp.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();

            created!.CargoManifests!.Add(new CargoManifestDTO
            {
                ManifestType = CargoManifestType.Loading,
                Entries = new List<CargoManifestEntryDTO>
                {
                    new CargoManifestEntryDTO { ContainerNumber = "ABCU2223334", Row = 1, Bay = 2, Tier = 1, StorageAreaCode = "WH001" }
                }
            });

            var updResp = await _client.PutAsJsonAsync($"/api/VesselVisitNotification/Update/{created.Code}", created);
            Assert.Equal(HttpStatusCode.BadRequest, updResp.StatusCode);
            var errors = await updResp.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("Cargo manifests cannot contain more than one loading manifest") || e.Contains("more than one loading"));
        }

        [Fact]
        public async Task Put_RepresentativeNotFound_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            var createResp = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);
            Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
            var created = await createResp.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();

            created!.RepresentativeCitizenID = "UNKNOWN_REP";
            var updResp = await _client.PutAsJsonAsync($"/api/VesselVisitNotification/Update/{created.Code}", created);
            Assert.Equal(HttpStatusCode.BadRequest, updResp.StatusCode);
            var errors = await updResp.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("Representative not found") || e.Contains("Representative"));
        }

        [Fact]
        public async Task Put_InvalidETAETD_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            var createResp = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);
            Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
            var created = await createResp.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();

            created!.Eta = DateTime.UtcNow.AddDays(10);
            created.Etd = DateTime.UtcNow.AddDays(9);
            var updResp = await _client.PutAsJsonAsync($"/api/VesselVisitNotification/Update/{created.Code}", created);
            Assert.Equal(HttpStatusCode.BadRequest, updResp.StatusCode);
            var errors = await updResp.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("ETA must be earlier") || e.Contains("ETA must be earlier than ETD"));
        }

        [Fact]
        public async Task Put_NegativeVolume_ReturnsBadRequest()
        {
            var dto = BuildValidDto();
            var createResp = await _client.PostAsJsonAsync("/api/VesselVisitNotification", dto);
            Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
            var created = await createResp.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();

            created!.Volume = -50.0;
            var updResp = await _client.PutAsJsonAsync($"/api/VesselVisitNotification/Update/{created.Code}", created);
            Assert.Equal(HttpStatusCode.BadRequest, updResp.StatusCode);
            var errors = await updResp.Content.ReadFromJsonAsync<List<string>>() ?? new List<string>();
            Assert.Contains(errors, e => e.Contains("Volume cannot be negative") || e.Contains("Volume cannot be"));
        }


    }
}