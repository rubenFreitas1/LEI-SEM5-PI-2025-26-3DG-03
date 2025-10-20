namespace Domain.Model;



public enum CrewRank
{
    Captain,
    SafetyOfficer,
    Officer

}

public class CrewMember
{
    public long Id { get; set; }

    public string Name { get; private set; } = string.Empty;

    public string CitizenId { get; private set; } = string.Empty;

    public CrewRank Rank { get; private set; }

    public string Nationality { get; private set; } = string.Empty;

    private CrewMember() { }

    public CrewMember(string name, string citizenId, CrewRank rank, string nationality)
    {
        ValidateNationality(nationality);
        nationality = nationality.ToUpper().Trim();
        ValidateCitizenId(citizenId);
        ValidateName(name);

        Name = name;
        CitizenId = citizenId;
        Nationality = nationality;
        Rank = rank;
    }

    public void ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Name cannot be empty.");
        }
    }

    public void ValidateCitizenId(string citizenId)
    {
        if (string.IsNullOrWhiteSpace(citizenId))
        {
            throw new ArgumentException("Citizen ID cannot be empty.");
        }

    }

    public void ValidateNationality(string nationality)
    {
        if (string.IsNullOrWhiteSpace(nationality))
            throw new ArgumentException("Nationality cannot be empty.");

        if (nationality.Length != 2)
            throw new ArgumentException("Nationality must be a 2-letter ISO country code (e.g., 'PT').");

        if (!nationality.All(char.IsLetter))
            throw new ArgumentException("Nationality must contain only letters (e.g., 'PT').");
    }





}