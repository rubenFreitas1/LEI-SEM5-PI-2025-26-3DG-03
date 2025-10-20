using System;
using System.Collections.Generic;
using Xunit;
using Domain.Model;

namespace Domain.Tests
{
    public class VesselVisitNotificationTest
    {
        private VesselRecord CreateValidVessel() => 
            new VesselRecord("9781889", "Test Vessel", new VesselType("Type1", "Desc", 4,4,4,4), "Operator");

        private Representative CreateValidRepresentative() =>
            new Representative(new ShippingAgentOrganization("AAA", "AAAA", "AAAA", "AAAA", "A13231"), 
                               "Joao", "AA1111", "PT", "teste@gmail.com", "999999999");

        private List<CrewMember> CreateValidCrew() =>
            new List<CrewMember>
            {
                new CrewMember("Captain A", "C001", CrewRank.Captain, "PT"),
                new CrewMember("Safety Officer B", "S002", CrewRank.SafetyOfficer, "PT"),
                new CrewMember("Officer C", "O003", CrewRank.Officer, "PT")
            };

        [Fact]
        public void Constructor_ValidParameters_ShouldCreate()
        {
            var eta = DateTime.UtcNow;
            var etd = eta.AddHours(2);

            var cargoManifests = new List<CargoManifest>();
            var vvn = new VesselVisitNotification(
                "2025-PA-000001",
                CreateValidVessel(),
                CreateValidRepresentative(),
                eta,
                etd,
                cargoManifests,
                CargoType.Container,
                1000,
                CreateValidCrew()
            );

            Assert.Equal("2025-PA-000001", vvn.Code);
            Assert.Equal(CargoType.Container, vvn.CargoType);
            Assert.Equal(1000, vvn.Volume);
            Assert.Equal(3, vvn.CrewMembers.Count);
            Assert.Equal(eta, vvn.ETA);
            Assert.Equal(etd, vvn.ETD);
        }

        [Fact]
        public void Constructor_NullVessel_ShouldThrow()
        {
            var eta = DateTime.UtcNow;
            var etd = eta.AddHours(2);

            Assert.Throws<ArgumentNullException>(() => new VesselVisitNotification(
                "2025-PA-000001",
                null!,
                CreateValidRepresentative(),
                eta,
                etd,
                new List<CargoManifest>(),
                CargoType.Container,
                1000,
                CreateValidCrew()
            ));
        }

        [Fact]
        public void Constructor_InvalidCode_ShouldThrow()
        {
            var eta = DateTime.UtcNow;
            var etd = eta.AddHours(2);

            Assert.Throws<ArgumentException>(() => new VesselVisitNotification(
                "INVALIDCODE",
                CreateValidVessel(),
                CreateValidRepresentative(),
                eta,
                etd,
                new List<CargoManifest>(),
                CargoType.Container,
                1000,
                CreateValidCrew()
            ));
        }

        [Fact]
        public void Constructor_ETAAfterETD_ShouldThrow()
        {
            var eta = DateTime.UtcNow;
            var etd = eta.AddHours(-2);

            Assert.Throws<ArgumentException>(() => new VesselVisitNotification(
                "2025-PA-000001",
                CreateValidVessel(),
                CreateValidRepresentative(),
                eta,
                etd,
                new List<CargoManifest>(),
                CargoType.Container,
                1000,
                CreateValidCrew()
            ));
        }

        [Fact]
        public void Constructor_HazardousWithoutSafetyOfficer_ShouldThrow()
        {
            var eta = DateTime.UtcNow;
            var etd = eta.AddHours(2);
            var crew = new List<CrewMember> { new CrewMember("Captain A", "C001", CrewRank.Captain, "PT") };

            Assert.Throws<ArgumentException>(() => new VesselVisitNotification(
                "2025-PA-000001",
                CreateValidVessel(),
                CreateValidRepresentative(),
                eta,
                etd,
                new List<CargoManifest>(),
                CargoType.Hazardous,
                1000,
                crew
            ));
        }

        [Fact]
        public void Constructor_WithoutCaptain_ShouldThrow()
        {
            var eta = DateTime.UtcNow;
            var etd = eta.AddHours(2);
            var crew = new List<CrewMember> { new CrewMember("Worker", "C001", CrewRank.Officer, "PT") };

            Assert.Throws<ArgumentException>(() => new VesselVisitNotification(
                "2025-PA-000001",
                CreateValidVessel(),
                CreateValidRepresentative(),
                eta,
                etd,
                new List<CargoManifest>(),
                CargoType.General,
                1000,
                crew
            ));
        }

        [Fact]
        public void AssignDock_ShouldSetDockAndUpdateTime()
        {
            var eta = DateTime.UtcNow;
            var etd = eta.AddHours(2);
            var vvn = new VesselVisitNotification(
                "2025-PA-000001",
                CreateValidVessel(),
                CreateValidRepresentative(),
                eta,
                etd,
                new List<CargoManifest>(),
                CargoType.Container,
                1000,
                CreateValidCrew()
            );
            var vesselType = new VesselType("Type1", "Desc", 4, 4, 4, 4);
            var dock = new Dock("Dock1", "Location1", 5000, 2000, 10,new List<VesselType> { vesselType });
            var oldTime = vvn.LastModifiedAt;

            vvn.AssignDock(dock);

            Assert.Equal(dock, vvn.AssignedDock);
            Assert.True(vvn.LastModifiedAt > oldTime);
        }

        [Fact]
        public void ChangeVolume_ShouldUpdateAndValidate()
        {
            var eta = DateTime.UtcNow;
            var etd = eta.AddHours(2);
            var vvn = new VesselVisitNotification(
                "2025-PA-000001",
                CreateValidVessel(),
                CreateValidRepresentative(),
                eta,
                etd,
                new List<CargoManifest>(),
                CargoType.Container,
                1000,
                CreateValidCrew()
            );

            vvn.ChangeVolume(2000);

            Assert.Equal(2000, vvn.Volume);
        }

        [Fact]
        public void ChangeETAETD_ShouldUpdateAndValidate()
        {
            var eta = DateTime.UtcNow;
            var etd = eta.AddHours(2);
            var vvn = new VesselVisitNotification(
                "2025-PA-000001",
                CreateValidVessel(),
                CreateValidRepresentative(),
                eta,
                etd,
                new List<CargoManifest>(),
                CargoType.Container,
                1000,
                CreateValidCrew()
            );

            var newETA = eta.AddHours(1);
            var newETD = etd.AddHours(1);

            vvn.ChangeETAETD(newETA, newETD);

            Assert.Equal(newETA, vvn.ETA);
            Assert.Equal(newETD, vvn.ETD);
        }
    }
}
