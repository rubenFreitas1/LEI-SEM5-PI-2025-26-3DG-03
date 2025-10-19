using System;
using Domain.Model;
using Xunit;

namespace Domain.Tests
{
    public class StorageAreaDockTest
    {
        private Dock CreateDock(long id = 1)
        {
            var vt = new VesselType("TypeA", "Desc", 100, 10, 5, 3);
            var dock = new Dock("Dock1", "Loc", 100, 10, 5, new System.Collections.Generic.List<VesselType> { vt });
            dock.Id = id;
            return dock;
        }

        private StorageArea CreateStorageArea(long id = 2)
        {
            var sa = new StorageArea("A1", "LocA", StorageAreaType.Yard, 100, 0);
            sa.Id = id;
            return sa;
        }

        [Fact]
        public void Constructor_ValidParameters_ShouldCreateAndSyncIds()
        {
            var dock = CreateDock(11);
            var sa = CreateStorageArea(22);
            var sad = new StorageAreaDock(sa, dock, 5.5);
            Assert.Equal(22, sad.StorageAreaId);
            Assert.Equal(11, sad.DockId);
            Assert.Equal(5.5, sad.Distance);
            Assert.Equal(sa, sad.StorageArea);
            Assert.Equal(dock, sad.Dock);
        }

        [Fact]
        public void Constructor_NullStorageArea_ShouldThrow()
        {
            var dock = CreateDock();
            StorageArea sa = null!;
            Assert.Throws<ArgumentNullException>(() => new StorageAreaDock(sa, dock, 1.0));
        }

        [Fact]
        public void Constructor_NullDock_ShouldThrow()
        {
            var sa = CreateStorageArea();
            Dock dock = null!;
            Assert.Throws<ArgumentNullException>(() => new StorageAreaDock(sa, dock, 1.0));
        }

        [Theory]
        [InlineData(-0.0001)]
        [InlineData(-10)]
        [InlineData(0)]
        public void Constructor_NegativeDistance_ShouldThrow(double distance)
        {
            var sa = CreateStorageArea();
            var dock = CreateDock();
            Assert.Throws<ArgumentOutOfRangeException>(() => new StorageAreaDock(sa, dock, distance));
        }

       
    }
}
