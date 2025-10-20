namespace Domain.Model;

using Domain.Model;
public enum CargoManifestType
{
    Loading,
    Unloading

}

public class CargoManifest
{
    public long Id { get; set; }

    public CargoManifestType ManifestType { get; private set; }
    public List<CargoManifestEntry>? Entries { get; private set; }

    public long VesselVisitNotificationId { get; private set; }
    public VesselVisitNotification VesselVisitNotification { get; private set; } = null!;


    private CargoManifest() { }

    public CargoManifest(CargoManifestType manifestType,List<CargoManifestEntry> cargoManifestEntries, VesselVisitNotification vesselVisitNotification)
    {
        if (vesselVisitNotification == null)
        {
            throw new ArgumentNullException(nameof(vesselVisitNotification), "Vessel visit notification cannot be null.");
        }

        ManifestType = manifestType;
        Entries = cargoManifestEntries ?? new List<CargoManifestEntry>();
        VesselVisitNotification = vesselVisitNotification;
        VesselVisitNotificationId = vesselVisitNotification.Id;
    }
}