using System;
using System.Collections.Generic;
using Xunit;
using Domain.Model.Resources;
using Domain.Model;
using ShippingManagement.Domain.Qualifications;

namespace Domain.Tests
{
    public class PhysicalResourceTest
    {
        private IEnumerable<Qualification> GetValidQualifications()
        {
            return new List<Qualification>
            {
                new Qualification("Q1", "Ship Captain", "Professional maritime leader"),
                new Qualification("Q2", "Engine Officer", "Responsible for engine operations")
            };
        }

        private OperationalWindow GetValidOperationalWindow()
        {
            return new OperationalWindow(DayOfWeek.Monday, DayOfWeek.Friday, new TimeSpan(8, 0, 0), new TimeSpan(18, 0, 0));
        }

        [Theory]
        [InlineData("PR001", "Physical Resource 1", "Main harbor crane", PhysicalResourceKind.STSCrane, 100)]
        [InlineData("PR-002", "Mobile Crane Alpha", "Versatile mobile crane", PhysicalResourceKind.MobileCrane, 50)]
        [InlineData("TRUCK001", "Heavy Duty Truck", "Container transport vehicle", PhysicalResourceKind.Truck, 25)]
        public void Constructor_ValidParameters_ShouldCreateObject(string code, string name, string description, PhysicalResourceKind kind, int capacity)
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();

            var resource = new PhysicalResource(code, name, description, kind, qualifications, capacity, operationalWindow);

            Assert.Equal(code.Trim(), resource.PhysicalResourceCode);
            Assert.Equal(name.Trim(), resource.Name);
            Assert.Equal(description.Trim(), resource.PhysicalResourceDescription);
            Assert.Equal(kind, resource.PhysicalResourceKind);
            Assert.Equal(capacity, resource.PhysicalResourceOperationalCapacity);
            Assert.Equal(ResourceStatus.Available, resource.Status);
            Assert.Null(resource.PhysicalResourceSetupTimeMinutes);
        }

        [Theory]
        [InlineData("PR001", "Physical Resource 1", "Main harbor crane", PhysicalResourceKind.STSCrane, 100, 30)]
        [InlineData("PR002", "Mobile Crane Beta", "Secondary mobile crane", PhysicalResourceKind.MobileCrane, 75, 0)]
        public void Constructor_ValidParametersWithSetupTime_ShouldCreateObject(string code, string name, string description, PhysicalResourceKind kind, int capacity, int setupTime)
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();

            var resource = new PhysicalResource(code, name, description, kind, qualifications, capacity, operationalWindow, setupTime);

            Assert.Equal(setupTime, resource.PhysicalResourceSetupTimeMinutes);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("ThisCodeIsTooLongForValidation123")]
        [InlineData("PR@001")]
        [InlineData("PR 001")]
        public void Constructor_InvalidCode_ShouldThrow(string code)
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();

            Assert.Throws<ArgumentException>(() =>
                new PhysicalResource(code, "Valid Name", "Valid description text", PhysicalResourceKind.STSCrane, qualifications, 100, operationalWindow));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("This is a very long description that exceeds the maximum allowed length of 250 characters and should definitely fail validation because it is way too long and goes beyond the established limit for physical resource descriptions that should not be longer than two hundred fifty characters")]
        public void Constructor_InvalidDescription_ShouldThrow(string description)
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();

            Assert.Throws<ArgumentException>(() =>
                new PhysicalResource("PR001", "Valid Name", description, PhysicalResourceKind.STSCrane, qualifications, 100, operationalWindow));
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(-100)]
        public void Constructor_InvalidOperationalCapacity_ShouldThrow(int capacity)
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();

            Assert.Throws<ArgumentOutOfRangeException>(() =>
                new PhysicalResource("PR001", "Valid Name", "Valid description text", PhysicalResourceKind.STSCrane, qualifications, capacity, operationalWindow));
        }

        [Fact]
        public void ChangeDescription_ValidDescription_ShouldUpdateDescription()
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("PR001", "Test Resource", "Original description text", PhysicalResourceKind.STSCrane, qualifications, 100, operationalWindow);

            resource.ChangeDescription("Updated description text");

            Assert.Equal("Updated description text", resource.PhysicalResourceDescription);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("This is a very long description that exceeds the maximum allowed length of 250 characters and should definitely fail validation because it is way too long and goes beyond the established limit for physical resource descriptions that should not be longer than two hundred fifty characters")]
        public void ChangeDescription_InvalidDescription_ShouldThrow(string description)
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("PR001", "Test Resource", "Original description text", PhysicalResourceKind.STSCrane, qualifications, 100, operationalWindow);

            Assert.Throws<ArgumentException>(() => resource.ChangeDescription(description));
        }

        [Fact]
        public void AssignToStorageArea_ValidStorageAreaForTruck_ShouldAssignCorrectly()
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("TRUCK001", "Test Truck", "Container transport vehicle", PhysicalResourceKind.Truck, qualifications, 25, operationalWindow);

            resource.AssignToStorageArea("SA001");

            Assert.Equal("SA001", resource.PhysicalResourceAssignedStorageAreaCode);
            Assert.Null(resource.PhysicalResourceAssignedDockName);
        }

        [Fact]
        public void AssignToStorageArea_STSCrane_ShouldThrow()
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("STS001", "Test STS Crane", "Harbor crane system", PhysicalResourceKind.STSCrane, qualifications, 100, operationalWindow);

            Assert.Throws<InvalidOperationException>(() => resource.AssignToStorageArea("SA001"));
        }

        [Fact]
        public void AssignToStorageArea_MobileCrane_ShouldThrow()
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("MC001", "Test Mobile Crane", "Versatile mobile crane", PhysicalResourceKind.MobileCrane, qualifications, 50, operationalWindow);

            Assert.Throws<InvalidOperationException>(() => resource.AssignToStorageArea("SA001"));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void AssignToStorageArea_InvalidStorageAreaCode_ShouldThrow(string storageAreaCode)
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("TRUCK001", "Test Truck", "Container transport vehicle", PhysicalResourceKind.Truck, qualifications, 25, operationalWindow);

            Assert.Throws<ArgumentException>(() => resource.AssignToStorageArea(storageAreaCode));
        }

        [Fact]
        public void AssignToDock_ValidDockForSTSCrane_ShouldAssignCorrectly()
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("STS001", "Test STS Crane", "Harbor crane system", PhysicalResourceKind.STSCrane, qualifications, 100, operationalWindow);

            resource.AssignToDock("Dock A");

            Assert.Equal("Dock A", resource.PhysicalResourceAssignedDockName);
            Assert.Null(resource.PhysicalResourceAssignedStorageAreaCode);
        }

        [Theory]
        [InlineData(PhysicalResourceKind.MobileCrane)]
        [InlineData(PhysicalResourceKind.Truck)]
        [InlineData(PhysicalResourceKind.Other)]
        public void AssignToDock_NonSTSCrane_ShouldThrow(PhysicalResourceKind kind)
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("TEST001", "Test Resource", "Test description text", kind, qualifications, 50, operationalWindow);

            Assert.Throws<InvalidOperationException>(() => resource.AssignToDock("Dock A"));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void AssignToDock_InvalidDockName_ShouldThrow(string dockName)
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("STS001", "Test STS Crane", "Harbor crane system", PhysicalResourceKind.STSCrane, qualifications, 100, operationalWindow);

            Assert.Throws<ArgumentException>(() => resource.AssignToDock(dockName));
        }

        [Fact]
        public void RemoveAssignment_MobileCrane_ShouldRemoveAssignments()
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("MC001", "Test Mobile Crane", "Versatile mobile crane", PhysicalResourceKind.MobileCrane, qualifications, 50, operationalWindow);

            resource.RemoveAssignment();

            Assert.Null(resource.PhysicalResourceAssignedStorageAreaCode);
            Assert.Null(resource.PhysicalResourceAssignedDockName);
        }

        [Fact]
        public void RemoveAssignment_STSCrane_ShouldThrow()
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("STS001", "Test STS Crane", "Harbor crane system", PhysicalResourceKind.STSCrane, qualifications, 100, operationalWindow);

            Assert.Throws<InvalidOperationException>(() => resource.RemoveAssignment());
        }

        [Fact]
        public void RemoveAssignment_Truck_ShouldThrow()
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("TRUCK001", "Test Truck", "Container transport vehicle", PhysicalResourceKind.Truck, qualifications, 25, operationalWindow);

            Assert.Throws<InvalidOperationException>(() => resource.RemoveAssignment());
        }

        [Theory]
        [InlineData(0)]
        [InlineData(50)]
        [InlineData(200)]
        public void ChangeOperationalCapacity_ValidCapacity_ShouldUpdateCapacity(int capacity)
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("PR001", "Test Resource", "Test description text", PhysicalResourceKind.STSCrane, qualifications, 100, operationalWindow);

            resource.ChangeOperationalCapacity(capacity);

            Assert.Equal(capacity, resource.PhysicalResourceOperationalCapacity);
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(-50)]
        public void ChangeOperationalCapacity_InvalidCapacity_ShouldThrow(int capacity)
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("PR001", "Test Resource", "Test description text", PhysicalResourceKind.STSCrane, qualifications, 100, operationalWindow);

            Assert.Throws<ArgumentOutOfRangeException>(() => resource.ChangeOperationalCapacity(capacity));
        }

        [Theory]
        [InlineData(null)]
        [InlineData(0)]
        [InlineData(30)]
        [InlineData(120)]
        public void ChangeSetupTime_ValidSetupTime_ShouldUpdateSetupTime(int? setupTime)
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("PR001", "Test Resource", "Test description text", PhysicalResourceKind.STSCrane, qualifications, 100, operationalWindow);

            resource.ChangeSetupTime(setupTime);

            Assert.Equal(setupTime, resource.PhysicalResourceSetupTimeMinutes);
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(-30)]
        public void ChangeSetupTime_InvalidSetupTime_ShouldThrow(int setupTime)
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("PR001", "Test Resource", "Test description text", PhysicalResourceKind.STSCrane, qualifications, 100, operationalWindow);

            Assert.Throws<ArgumentOutOfRangeException>(() => resource.ChangeSetupTime(setupTime));
        }

        [Theory]
        [InlineData(PhysicalResourceKind.STSCrane)]
        [InlineData(PhysicalResourceKind.MobileCrane)]
        [InlineData(PhysicalResourceKind.Truck)]
        [InlineData(PhysicalResourceKind.Other)]
        public void ChangeKind_ValidKind_ShouldUpdateKind(PhysicalResourceKind kind)
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("PR001", "Test Resource", "Test description text", PhysicalResourceKind.STSCrane, qualifications, 100, operationalWindow);

            resource.ChangeKind(kind);

            Assert.Equal(kind, resource.PhysicalResourceKind);
        }

        [Fact]
        public void Deactivate_ShouldSetStatusToUnavailable()
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("PR001", "Test Resource", "Test description text", PhysicalResourceKind.STSCrane, qualifications, 100, operationalWindow);

            resource.Deactivate();

            Assert.Equal(ResourceStatus.Unavailable, resource.Status);
        }

        [Fact]
        public void Reactivate_ShouldSetStatusToAvailable()
        {
            var qualifications = GetValidQualifications();
            var operationalWindow = GetValidOperationalWindow();
            var resource = new PhysicalResource("PR001", "Test Resource", "Test description text", PhysicalResourceKind.STSCrane, qualifications, 100, operationalWindow, status: ResourceStatus.Unavailable);

            resource.Reactivate();

            Assert.Equal(ResourceStatus.Available, resource.Status);
        }
    }
}
