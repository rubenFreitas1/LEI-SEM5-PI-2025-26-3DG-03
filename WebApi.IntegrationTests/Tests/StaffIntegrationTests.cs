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
    public class StaffIntegrationTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public StaffIntegrationTests(IntegrationTestsWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();
                Utilities.ReinitializeDbForTests(db);
            }
        }

        [Theory]
        [InlineData("Aaaaaaa")]
        [InlineData("NonExistentType")]
        public async Task GetVesselTypeByName_NotFound(string name)
        {
            var response = await _client.GetAsync($"/api/Staff/ByName/{name}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }


        [Theory]
        [InlineData("Staff One")]
        [InlineData("Staff Two")]
        public async Task GetVesselTypeByName_Found(string name)
        {
            var response = await _client.GetAsync($"/api/Staff/ByName/{name}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetStaffById_NotFound()
        {
            var response = await _client.GetAsync("/api/Staff/ByID/99999");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetStaffById_Found()
        {
            var response = await _client.GetAsync("/api/Staff");
            response.EnsureSuccessStatusCode();
            var staffs = await response.Content.ReadFromJsonAsync<List<StaffDTO>>();
            Assert.NotNull(staffs);
            Assert.NotEmpty(staffs);

            foreach (var s in staffs)
            {
                var getByIdResponse = await _client.GetAsync($"/api/Staff/ByID/{s.Id}");
                Assert.Equal(HttpStatusCode.OK, getByIdResponse.StatusCode);
                var returned = await getByIdResponse.Content.ReadFromJsonAsync<StaffDTO>();
                Assert.NotNull(returned);
                Assert.Equal(s.Name, returned.Name);
            }
        }


        [Theory]
        [InlineData("QUAL1")]
        [InlineData("QUAL2")]
        public async Task GetStaffByQualificationCode_Found(string description)
        {
            var response = await _client.GetAsync($"/api/Staff/ByQualification/{description}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData("NonExistentQualificationCode")]
        public async Task GetStaffByQualificationCode_NotFound(string description)
        {
            var response = await _client.GetAsync($"/api/Staff/ByQualification/{description}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData(0)]
        public async Task GetStaffByStatus_FoundAvailable(int status)
        {
            var response = await _client.GetAsync($"/api/Staff/ByStatus/{status}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData(1)]
        public async Task GetStaffByStatus_FoundUnavailable(int status)
        {
            var response = await _client.GetAsync($"/api/Staff/ByStatus/{status}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Theory]
        [InlineData(2)]
        [InlineData(99)]
        public async Task GetStaffByStatus_NotFound(int status)
        {
            var response = await _client.GetAsync($"/api/Staff/ByStatus/{status}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task PostStaff_ThenGetByName_ReturnsCreatedAndOk()
        {
            var dto = new StaffDTO
            {
                Name = "TestName",
                QualificationCodes = new List<string> { "QUAL1", "QUAL2" },
                Email = "stafftest@gmail.com",
                Phone = "987654333",
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "09:00",
                    EndTime = "17:00"
                },
                Status = ResourceStatus.Available
            };
            var postResponse = await _client.PostAsJsonAsync("/api/Staff", dto);
            Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/Staff/ByName/{dto.Name}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
            var returned = await getResponse.Content.ReadFromJsonAsync<StaffDTO>();
            Assert.NotNull(returned);
            Assert.Equal(dto.Name, returned.Name);
        }

        [Theory]
        [InlineData("staff1@gmail.com")]
        [InlineData("staff2@gmail.com")]
        public async Task PostStaff_DuplicateEmail_ReturnsConflict(string email)
        {
            var dto = new StaffDTO
            {
                Name = "TestName",
                QualificationCodes = new List<string> { "QUAL1", "QUAL2" },
                Email = email,
                Phone = "987654333",
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "09:00",
                    EndTime = "17:00"
                },
                Status = ResourceStatus.Available
            };
            var postResponse1 = await _client.PostAsJsonAsync("/api/Staff", dto);
            Assert.Equal(HttpStatusCode.Conflict, postResponse1.StatusCode);
        }

        [Theory]
        [InlineData("987654321")]
        [InlineData("987654322")]
        public async Task PostStaff_DuplicatePhone_ReturnsConflict(string phone)
        {
            var dto = new StaffDTO
            {
                Name = "TestName",
                QualificationCodes = new List<string> { "QUAL1", "QUAL2" },
                Email = "testemail@gmail.com",
                Phone = phone,
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "09:00",
                    EndTime = "17:00"
                },
                Status = ResourceStatus.Available
            };
            var postResponse1 = await _client.PostAsJsonAsync("/api/Staff", dto);
            Assert.Equal(HttpStatusCode.Conflict, postResponse1.StatusCode);
        }

        [Theory]
        [InlineData("123")]
        [InlineData("abcdef")]
        [InlineData("987-654-321")]
        [InlineData("")]
        public async Task PostStaff_InvalidPhoneFormat_ReturnsBadRequest(string phone)
        {
            var dto = new StaffDTO
            {
                Name = "TestName",
                QualificationCodes = new List<string> { "QUAL1", "QUAL2" },
                Email = "validemail@gmail.com",
                Phone = phone,
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "09:00",
                    EndTime = "17:00"
                },
                Status = ResourceStatus.Available
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Staff", dto);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("9:00")]
        [InlineData("09-00")]
        [InlineData("25:00")]
        [InlineData("12:60")]
        [InlineData("abc")]
        [InlineData("")]
        public async Task PostStaff_InvalidTimeFormat_ReturnsBadRequest(string startTime)
        {
            var dto = new StaffDTO
            {
                Name = "TestName",
                QualificationCodes = new List<string> { "QUAL1", "QUAL2" },
                Email = "validemail@gmail.com",
                Phone = "987654333",
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = startTime,
                    EndTime = "17:00"
                },
                Status = ResourceStatus.Available
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Staff", dto);

            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);

            var error = await postResponse.Content.ReadAsStringAsync();
            Assert.Contains("invalid time", error, StringComparison.OrdinalIgnoreCase);
        }
        [Fact]
        public async Task PostStaff_EndTimeBeforeStartTime_ReturnsBadRequest()
        {
            var dto = new StaffDTO
            {
                Name = "InvalidTimeStaff",
                Email = "invalidtime@gmail.com",
                Phone = "987654337",
                QualificationCodes = new List<string> { "QUAL1" },
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "17:00",
                    EndTime = "09:00"
                },
                Status = ResourceStatus.Available
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Staff", dto);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
            var error = await postResponse.Content.ReadAsStringAsync();
            Assert.Contains("EndTime cannot be before StartTime", error, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task PostStaff_EndDayBeforeStartDay_ReturnsBadRequest()
        {
            var dto = new StaffDTO
            {
                Name = "InvalidDayStaff",
                Email = "invalidday@gmail.com",
                Phone = "987654338",
                QualificationCodes = new List<string> { "QUAL1" },
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Friday,
                    EndDay = DayOfWeek.Monday,
                    StartTime = "09:00",
                    EndTime = "17:00"
                },
                Status = ResourceStatus.Available
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Staff", dto);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
            var error = await postResponse.Content.ReadAsStringAsync();
            Assert.Contains("EndDay cannot be before StartDay", error, StringComparison.OrdinalIgnoreCase);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public async Task PostStaff_NullOrEmptyName_ReturnsBadRequest(string? name)
        {
            var dto = new StaffDTO
            {
                Name = name,
                QualificationCodes = new List<string> { "QUAL1" },
                Email = "uniqueemail@gmail.com",
                Phone = "987654334",
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "09:00",
                    EndTime = "17:00"
                },
                Status = ResourceStatus.Available
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Staff", dto);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public async Task PostStaff_NullOrEmptyEmail_ReturnsBadRequest(string? email)
        {
            var dto = new StaffDTO
            {
                Name = "TestName",
                QualificationCodes = new List<string> { "QUAL1" },
                Email = email,
                Phone = "987654335",
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "09:00",
                    EndTime = "17:00"
                },
                Status = ResourceStatus.Available
            };

            var postResponse = await _client.PostAsJsonAsync("/api/Staff", dto);
            Assert.Equal(HttpStatusCode.BadRequest, postResponse.StatusCode);
        }

        [Theory]
        [InlineData("Updated Staff One", new[] { "QUAL1" }, "staff1updated@gmail.com", "987654329", ResourceStatus.Available)]
        [InlineData("Updated Staff Two", new[] { "QUAL2" }, "staff2updated@gmail.com", "987654330", ResourceStatus.Unavailable)]
        public async Task PutStaff_UpdatesSuccessfully(string name, string[] qualificationCodes, string email, string phone, ResourceStatus status)
        {
            var response = await _client.GetAsync("/api/Staff");
            response.EnsureSuccessStatusCode();
            var staffs = await response.Content.ReadFromJsonAsync<List<StaffDTO>>();
            Assert.NotNull(staffs);
            var staff = staffs!.FirstOrDefault(s => s.Email == "staff1@gmail.com");
            Assert.NotNull(staff);

            staff.Name = name;
            staff.Email = email;
            staff.Phone = phone;
            staff.Status = status;
            staff.QualificationCodes = qualificationCodes;

            var putResponse = await _client.PutAsJsonAsync($"/api/Staff/Update/{staff.Id}", staff);
            Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

            var getResponse = await _client.GetAsync("/api/Staff");
            getResponse.EnsureSuccessStatusCode();
            var updatedList = await getResponse.Content.ReadFromJsonAsync<List<StaffDTO>>();
            var returned = updatedList!.FirstOrDefault(s => s.Email == email);
            Assert.NotNull(returned);
            Assert.Equal(name, returned.Name);
            Assert.Equal(email, returned.Email);
            Assert.Equal(phone, returned.Phone);
            Assert.Equal(status, returned.Status);
            Assert.Equal(qualificationCodes, returned.QualificationCodes);
        }

        [Fact]
        public async Task PutStaff_NotExisting_ReturnsNotFound()
        {
            var dto = new StaffDTO
            {
                Id = 99999,
                Name = "NonExistent",
                Email = "nonexistent@gmail.com",
                Phone = "987654336",
                QualificationCodes = new List<string> { "QUAL1" },
                OperationalWindow = new OperationalWindowDTO
                {
                    StartDay = DayOfWeek.Monday,
                    EndDay = DayOfWeek.Friday,
                    StartTime = "09:00",
                    EndTime = "17:00"
                },
                Status = ResourceStatus.Available
            };

            var putResponse = await _client.PutAsJsonAsync($"/api/Staff/Update/{dto.Id}", dto);
            Assert.Equal(HttpStatusCode.NotFound, putResponse.StatusCode);
        }

        [Fact]
        public async Task PutStaff_UpdatePartialFields_Succeeds()
        {
            var response = await _client.GetAsync("/api/Staff");
            response.EnsureSuccessStatusCode();
            var staffs = await response.Content.ReadFromJsonAsync<List<StaffDTO>>();
            var staff = staffs!.First();
            Assert.NotNull(staff);

            var originalEmail = staff.Email;
            var originalPhone = staff.Phone;

            staff.Name = "Partially Updated Name";
            staff.Status = ResourceStatus.Unavailable;

            var putResponse = await _client.PutAsJsonAsync($"/api/Staff/Update/{staff.Id}", staff);
            Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/Staff/ByID/{staff.Id}");
            var updatedStaff = await getResponse.Content.ReadFromJsonAsync<StaffDTO>();
            Assert.NotNull(updatedStaff);
            Assert.Equal("Partially Updated Name", updatedStaff!.Name);
            Assert.Equal(ResourceStatus.Unavailable, updatedStaff.Status);

            Assert.Equal(originalEmail, updatedStaff.Email);
            Assert.Equal(originalPhone, updatedStaff.Phone);
        }

        [Fact]
        public async Task PutStaff_UpdateWithDuplicateEmail_ReturnsConflict()
        {
            var response = await _client.GetAsync("/api/Staff");
            response.EnsureSuccessStatusCode();
            var staffs = await response.Content.ReadFromJsonAsync<List<StaffDTO>>();
            Assert.True(staffs!.Count >= 2, "Need at least 2 staff entries for this test");

            var staff1 = staffs[0];
            var staff2 = staffs[1];

            staff1.Email = staff2.Email;

            var putResponse = await _client.PutAsJsonAsync($"/api/Staff/Update/{staff1.Id}", staff1);
            Assert.Equal(HttpStatusCode.Conflict, putResponse.StatusCode);
        }
        [Fact]
        public async Task PutStaff_UpdateWithDuplicatePhone_ReturnsConflict()
        {
            var response = await _client.GetAsync("/api/Staff");
            response.EnsureSuccessStatusCode();
            var staffs = await response.Content.ReadFromJsonAsync<List<StaffDTO>>();
            Assert.True(staffs!.Count >= 2, "Need at least 2 staff entries for this test");

            var staff1 = staffs[0];
            var staff2 = staffs[1];

            staff1.Phone = staff2.Phone;

            var putResponse = await _client.PutAsJsonAsync($"/api/Staff/Update/{staff1.Id}", staff1);
            Assert.Equal(HttpStatusCode.Conflict, putResponse.StatusCode);
        }
        [Theory]
        [InlineData("", "validemail@gmail.com")]
        [InlineData("Valid Name", "")]
        [InlineData("Valid Name", "invalidemail")]
        public async Task PutStaff_UpdateInvalidFields_ReturnsBadRequest(string name, string email)
        {
            var response = await _client.GetAsync("/api/Staff");
            response.EnsureSuccessStatusCode();
            var staffs = await response.Content.ReadFromJsonAsync<List<StaffDTO>>();
            var staff = staffs!.First();

            staff.Name = name;
            staff.Email = email;

            var putResponse = await _client.PutAsJsonAsync($"/api/Staff/Update/{staff.Id}", staff);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);
        }

        [Fact]
        public async Task PutStaff_UpdateInvalidOperationalWindow_ReturnsBadRequest()
        {
            var response = await _client.GetAsync("/api/Staff");
            response.EnsureSuccessStatusCode();
            var staffs = await response.Content.ReadFromJsonAsync<List<StaffDTO>>();
            var staff = staffs!.First();

            Assert.NotNull(staff.OperationalWindow);

            staff.OperationalWindow!.StartTime = "17:00";
            staff.OperationalWindow.EndTime = "09:00";
            staff.OperationalWindow.StartDay = DayOfWeek.Friday;
            staff.OperationalWindow.EndDay = DayOfWeek.Monday;

            var putResponse = await _client.PutAsJsonAsync($"/api/Staff/Update/{staff.Id}", staff);
            Assert.Equal(HttpStatusCode.BadRequest, putResponse.StatusCode);

            var error = await putResponse.Content.ReadAsStringAsync();
            Assert.Contains("EndTime cannot be before StartTime", error, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("EndDay cannot be before StartDay", error, StringComparison.OrdinalIgnoreCase);
        }


    }
}
