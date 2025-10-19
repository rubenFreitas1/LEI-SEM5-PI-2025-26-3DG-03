using System;
using System.Collections.Generic;
using Domain.Model;
using Xunit;

namespace Domain.Tests
{
    public class StorageAreaTest
    {
        private Dock CreateDock(long id = 1, string name = "Dock1")
        {
            var vesselType = new VesselType("TypeA", "Desc", 100, 10, 5, 3);
            var dock = new Dock(name, "Loc", 100, 10, 5, new List<VesselType> { vesselType });
            dock.Id = id;
            return dock;
        }

        [Theory]
        [InlineData("A1", "Loc1", StorageAreaType.Yard, 1000, 0)]
        [InlineData("B2", "Warehouse1", StorageAreaType.Warehouse, 500, 100)]
        public void Constructor_ValidParameters_ShouldCreate(string code, string location, StorageAreaType type, int maxCapacity, int currentCapacity)
        {
            var sa = new StorageArea(code, location, type, maxCapacity, currentCapacity);
            Assert.Equal(code, sa.Code);
            Assert.Equal(location, sa.Location);
            Assert.Equal(type, sa.Type);
            Assert.Equal(maxCapacity, sa.MaxCapacity);
            Assert.Equal(currentCapacity, sa.CurrentCapacity);
            Assert.NotEqual(default, sa.LastModifiedAt);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_InvalidCode_ShouldThrow(string code)
        {
            Assert.Throws<ArgumentException>(() => new StorageArea(code, "Loc", StorageAreaType.Yard, 100, 0));
        }

        [Theory]
        [InlineData("code!")]
        [InlineData("space code")]
        public void Constructor_NonAlphanumericCode_ShouldThrow(string code)
        {
            Assert.Throws<ArgumentException>(() => new StorageArea(code, "Loc", StorageAreaType.Yard, 100, 0));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_InvalidLocation_ShouldThrow(string location)
        {
            Assert.Throws<ArgumentException>(() => new StorageArea("C1", location, StorageAreaType.Yard, 100, 0));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void Constructor_InvalidMaxCapacity_ShouldThrow(int maxCapacity)
        {
            Assert.Throws<ArgumentOutOfRangeException>(() => new StorageArea("C1", "Loc", StorageAreaType.Yard, maxCapacity, 0));
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(1001)]
        public void Constructor_InvalidCurrentCapacity_ShouldThrow(int currentCapacity)
        {
            // currentCapacity > maxCapacity should throw
            Assert.Throws<ArgumentOutOfRangeException>(() => new StorageArea("C1", "Loc", StorageAreaType.Yard, 1000, currentCapacity));
        }

        [Fact]
        public void ChangeLocation_Valid_ShouldUpdateAndSetLastModifiedAt()
        {
            var sa = new StorageArea("C1", "Loc", StorageAreaType.Yard, 100, 10);
            var before = sa.LastModifiedAt;
            sa.ChangeLocation("NewLoc");
            Assert.Equal("NewLoc", sa.Location);
            Assert.True(sa.LastModifiedAt > before);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void ChangeLocation_Invalid_ShouldThrow(string location)
        {
            var sa = new StorageArea("C1", "Loc", StorageAreaType.Yard, 100, 10);
            Assert.Throws<ArgumentException>(() => sa.ChangeLocation(location));
        }

        [Fact]
        public void ChangeMaxCapacity_Valid_ShouldUpdateAndKeepCurrentWithinBounds()
        {
            var sa = new StorageArea("C1", "Loc", StorageAreaType.Yard, 100, 20);
            var before = sa.LastModifiedAt;
            sa.ChangeMaxCapacity(200);
            Assert.Equal(200, sa.MaxCapacity);
            Assert.True(sa.LastModifiedAt > before);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-5)]
        public void ChangeMaxCapacity_Invalid_ShouldThrow(int maxCapacity)
        {
            var sa = new StorageArea("C1", "Loc", StorageAreaType.Yard, 100, 20);
            Assert.Throws<ArgumentOutOfRangeException>(() => sa.ChangeMaxCapacity(maxCapacity));
        }

        [Fact]
        public void ChangeCurrentCapacity_Valid_ShouldUpdate()
        {
            var sa = new StorageArea("C1", "Loc", StorageAreaType.Yard, 100, 20);
            var before = sa.LastModifiedAt;
            sa.ChangeCurrentCapacity(50);
            Assert.Equal(50, sa.CurrentCapacity);
            Assert.True(sa.LastModifiedAt > before);
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(101)]
        public void ChangeCurrentCapacity_Invalid_ShouldThrow(int value)
        {
            var sa = new StorageArea("C1", "Loc", StorageAreaType.Yard, 100, 20);
            Assert.Throws<ArgumentOutOfRangeException>(() => sa.ChangeCurrentCapacity(value));
        }

        [Fact]
        public void AddStorageAreaDock_Valid_ShouldAdd()
        {
            var sa = new StorageArea("C1", "Loc", StorageAreaType.Yard, 100, 0);
            var dock = CreateDock(10, "D1");
            sa.AddStorageAreaDock(dock, 12.5);
            Assert.Single(sa.StorageAreaDocks);
            var sad = sa.StorageAreaDocks[0];
            Assert.Equal(dock, sad.Dock);
            Assert.Equal(12.5, sad.Distance);
            Assert.True(sa.LastModifiedAt > default(DateTime));
        }

        [Fact]
        public void AddStorageAreaDock_NullDock_ShouldThrow()
        {
            var sa = new StorageArea("C1", "Loc", StorageAreaType.Yard, 100, 0);
            Dock dock = null!;
            Assert.Throws<ArgumentNullException>(() => sa.AddStorageAreaDock(dock, 10));
        }

        [Fact]
        public void AddStorageAreaDock_NegativeDistance_ShouldThrow()
        {
            var sa = new StorageArea("C1", "Loc", StorageAreaType.Yard, 100, 0);
            var dock = CreateDock(11, "D2");
            Assert.Throws<ArgumentOutOfRangeException>(() => sa.AddStorageAreaDock(dock, -1));
        }

        [Fact]
        public void AddStorageAreaDock_DuplicateDock_ShouldThrow()
        {
            var sa = new StorageArea("C1", "Loc", StorageAreaType.Yard, 100, 0);
            var dock = CreateDock(12, "D3");
            sa.AddStorageAreaDock(dock, 5);
            Assert.Throws<InvalidOperationException>(() => sa.AddStorageAreaDock(dock, 7));
        }
    }
}