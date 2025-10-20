namespace Domain.Model;

public enum CargoType
{
    Container,
    Bulk,
    Liquid,
    General,
    Refrigerated,
    Hazardous
}

public enum Status
{

    Pending,
    Approved,
    Rejected,
    InProgress
}


public class VesselVisitNotification
{

    public long Id { get; set; }

    public string Code { get; private set; } = string.Empty;

    public VesselRecord Vessel { get; private set; } = null!;

    public Representative Representative { get; private set; } = null!;

    public DateTime ETA { get; private set; }

    public DateTime ETD { get; private set; }

    public List<CargoManifest> CargoManifests { get; private set; } = new List<CargoManifest>();

    public CargoType CargoType { get; private set; }

    public double Volume { get; private set; }

    public List<CrewMember> CrewMembers { get; private set; } = null!;

    public Dock? AssignedDock { get; private set; } = null;

    public DateTime LastModifiedAt { get; set; }


    private VesselVisitNotification() { }


    public VesselVisitNotification(string code, VesselRecord vessel, Representative representative, DateTime eta, DateTime etd, List<CargoManifest> cargoManifests, CargoType cargoType, double volume, List<CrewMember> crewMembers)
    {
        CargoType = cargoType;
        ValidateCode(code);
        ValidateETAETD(eta, etd);
        ValidateVesselRecord(vessel);
        ValidateRepresentative(representative);
        ValidateCargoManifests(cargoManifests);
        ValidateVolume(volume);
        ValidateCrewMembers(crewMembers);

        Code = code;
        Vessel = vessel;
        Representative = representative;
        ETA = eta;
        ETD = etd;
        CargoManifests = cargoManifests ?? new List<CargoManifest>();
        Volume = volume;
        CrewMembers = crewMembers;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void AssignDock(Dock dock)
    {
        if (dock == null)
        {
            throw new ArgumentNullException(nameof(dock), "Dock cannot be null.");
        }
        AssignedDock = dock;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ValidateCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Code cannot be empty.");

        // Formato esperado: YYYY-PA-000001
        var pattern = @"^\d{4}-PA-\d{6}$";
        if (!System.Text.RegularExpressions.Regex.IsMatch(code, pattern))
            throw new ArgumentException("Code must follow the pattern YYYY-PA-000001.");
    }

    public void ValidateETAETD(DateTime eta, DateTime etd)
    {
        if (eta >= etd)
        {
            throw new ArgumentException("ETA must be earlier than ETD.");
        }
    }

    public void ValidateVesselRecord(VesselRecord vessel)
    {
        if (vessel == null)
        {
            throw new ArgumentNullException(nameof(vessel), "Vessel cannot be null.");
        }
    }

    public void ValidateRepresentative(Representative representative)
    {
        if (representative == null)
        {
            throw new ArgumentNullException(nameof(representative), "Representative cannot be null.");
        }
    }

    public void ValidateCargoManifests(List<CargoManifest> cargoManifests)
    {
        if (cargoManifests != null)
        {
            if (cargoManifests.FindAll(cm => cm.ManifestType == CargoManifestType.Loading).Count > 1)
            {
                throw new ArgumentException("Cargo manifests cannot contain more than one loading manifest.");
            }
            if (cargoManifests.FindAll(cm => cm.ManifestType == CargoManifestType.Unloading).Count > 1)
            {
                throw new ArgumentException("Cargo manifests cannot contain more than one unloading manifest.");
            }
        }
    }

    public void ValidateVolume(double volume)
    {
        if (volume < 0)
        {
            throw new ArgumentException("Volume cannot be negative.");
        }
    }

    public void ValidateCrewMembers(List<CrewMember> crewMembers)
    {
        if (crewMembers == null || crewMembers.Count == 0)
        {
            throw new ArgumentException("There must be at least one crew member.");
        }

        if (!crewMembers.Any(cm => cm.Rank == CrewRank.Captain))
        {
            throw new ArgumentException("There must be at least one crew member with the rank of Captain.");
        }

        if (!crewMembers.Any(cm => cm.Rank == CrewRank.SafetyOfficer) && CargoType == CargoType.Hazardous)
        {
            throw new ArgumentException("There must be at least one crew member with the rank of Safety Officer.");
        }
    }

    public void ChangeVessel(VesselRecord vessel)
    {
        ValidateVesselRecord(vessel);
        Vessel = vessel;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeETAETD(DateTime eta, DateTime etd)
    {
        ValidateETAETD(eta, etd);
        ETA = eta;
        ETD = etd;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeVolume(double volume)
    {
        ValidateVolume(volume);
        Volume = volume;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeCargoType(CargoType cargoType)
    {
        CargoType = cargoType;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeCargoManifests(List<CargoManifest> cargoManifests)
    {
        ValidateCargoManifests(cargoManifests);
        CargoManifests = cargoManifests;
        LastModifiedAt = DateTime.UtcNow;
    }
    
    public void ChangeCrewMembers(List<CrewMember> crewMembers)
    {
        ValidateCrewMembers(crewMembers);
        CrewMembers = crewMembers;
        LastModifiedAt = DateTime.UtcNow;
    }


}