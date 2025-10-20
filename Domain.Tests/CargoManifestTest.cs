using System;
using System.Collections.Generic;
using Xunit;
using Domain.Model;

namespace Domain.Tests
{
    public class CargoManifestTest
    {
        private List<CrewMember> CreateValidCrew() =>
            new List<CrewMember>
            {
                new CrewMember("Captain A", "C001", CrewRank.Captain, "PT"),
                new CrewMember("Safety Officer B", "S002", CrewRank.SafetyOfficer, "PT"),
                new CrewMember("Officer C", "O003", CrewRank.Officer, "PT")
            };
        private VesselVisitNotification CreateValidVesselVisitNotification()
        {
            return new VesselVisitNotification(
                "2025-PA-000001",
                new VesselRecord("9781889", "Test Vessel", CreateValidVesselType(), "Test Operator"),
                new Representative(CreateValidShippingAgentOrganization(), "Joao", "AA1111", "PT", "teste@gmail.com", "999999999"),
                DateTime.UtcNow,
                DateTime.UtcNow.AddHours(2),
                new List<CargoManifest>(),
                CargoType.Container,
                1000,
                CreateValidCrew()
            );
        }
        
        private ShippingAgentOrganization CreateValidShippingAgentOrganization() =>
            new ShippingAgentOrganization("AAA", "AAAAAAA", "AAAAAA", "AAAAAA", "A13231");

        private VesselType CreateValidVesselType() => new VesselType("Type1", "Description1", 4, 4, 4, 4);

        private CargoManifestEntry CreateValidEntry(CargoManifest manifest)
        {
            var container = new Container("ABCU1234567");
            var storageArea = new StorageArea("SA01", "Location1", StorageAreaType.Warehouse, 100, 0);
            return new CargoManifestEntry(container, 1, 1, 1, storageArea, manifest);
        }

        [Fact]
        public void Constructor_ValidParameters_ShouldCreateManifest()
        {
            var vesselVisit = CreateValidVesselVisitNotification();
            var entries = new List<CargoManifestEntry>();

            var manifest = new CargoManifest(CargoManifestType.Loading, entries, vesselVisit);

            Assert.Equal(CargoManifestType.Loading, manifest.ManifestType);
            Assert.Equal(entries, manifest.Entries);
            Assert.Equal(vesselVisit, manifest.VesselVisitNotification);
            Assert.Equal(vesselVisit.Id, manifest.VesselVisitNotificationId);
        }

        [Fact]
        public void Constructor_NullEntries_ShouldInitializeEmptyList()
        {
            var vesselVisit = CreateValidVesselVisitNotification();

            var manifest = new CargoManifest(CargoManifestType.Unloading, null!, vesselVisit);

            Assert.NotNull(manifest.Entries);
            Assert.Empty(manifest.Entries);
        }

        [Fact]
        public void Constructor_NullVesselVisit_ShouldThrow()
        {
            var entries = new List<CargoManifestEntry>();

            Assert.Throws<ArgumentNullException>(() =>
            {
                var manifest = new CargoManifest(CargoManifestType.Loading, entries, null!);
            });
        }

        [Fact]
        public void Entries_CanAddEntry()
        {
            var vesselVisit = CreateValidVesselVisitNotification();

            var manifest = new CargoManifest(CargoManifestType.Loading, null!, vesselVisit);
            var entry = CreateValidEntry(manifest);

            manifest.Entries!.Add(entry);

            Assert.Single(manifest.Entries);
            Assert.Equal(entry, manifest.Entries[0]);
        }
    }
}
