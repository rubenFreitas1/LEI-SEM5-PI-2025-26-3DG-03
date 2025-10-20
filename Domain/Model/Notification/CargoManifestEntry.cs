    namespace Domain.Model;



    public class CargoManifestEntry
    {
        public long Id { get; set; }

        public Container Container { get; private set; } = null!;

        public int Row { get; private set; }

        public int Bay { get; private set; }

        public int Tier { get; private set; }

        public StorageArea StorageArea { get; private set; } = null!;

        public long CargoManifestId { get; private set; }
        public CargoManifest CargoManifest { get; private set; } = null!;

        private CargoManifestEntry() { }

        public CargoManifestEntry(Container container, int row, int bay, int tier, StorageArea storageArea, CargoManifest cargoManifest)
        {
            ValidateContainer(container);
            ValidateRow(row);
            ValidateBay(bay);
            ValidateTier(tier);
            ValidateLocation(storageArea);
            ValidateCargoManifest(cargoManifest);

            Container = container;
            Row = row;
            Bay = bay;
            Tier = tier;
            StorageArea = storageArea;
            CargoManifestId = cargoManifest.Id;
            CargoManifest = cargoManifest;
        }

        public void ValidateCargoManifest(CargoManifest cargoManifest)
        {
            if (cargoManifest == null)
            {
                throw new ArgumentException("Cargo manifest cannot be null.");
            }
        }


        public void ValidateContainer(Container container)
        {
            if (container == null)
            {
                throw new ArgumentException("Container cannot be null.");
            }
        }

        public void ValidateRow(int row)
        {
            if (row <= 0)
            {
                throw new ArgumentException("Row cannot be negative.");
            }
        }
        public void ValidateBay(int bay)
        {
            if (bay <= 0)
            {
                throw new ArgumentException("Bay cannot be negative.");
            }
        }

        public void ValidateTier(int tier)
        {
            if (tier <= 0)
            {
                throw new ArgumentException("Tier cannot be negative.");
            }
        }

        public void ValidateLocation(StorageArea location)
        {
            if (location == null)
            {
                throw new ArgumentException("Location cannot be null.");
            }
        }
    }