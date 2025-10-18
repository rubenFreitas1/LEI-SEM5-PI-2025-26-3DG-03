namespace Application.DTO;

using Domain.Model;

public class RepresentativeDTO
{
    public long Id { get; set; }

    public string? Name { get; set; }

    public string? CitizenId { get; set; }

    public string? Nationality { get; set; }

    public string? Email { get; set; }

    public string? PhoneNumber { get; set; }

    public RepresentativeDTO() { }

    public RepresentativeDTO(string name, string citizenId, string nationality, string email, string phoneNumber)
    {
        Name = name;
        CitizenId = citizenId;
        Nationality = nationality;
        Email = email;
        PhoneNumber = phoneNumber;
    }

    static public RepresentativeDTO ToDTO(Representative representative)
    {
        try
        {
            RepresentativeDTO representativeDTO = new RepresentativeDTO(representative.Name!, representative.CitizenId!, representative.Nationality!, representative.Email!, representative.PhoneNumber!);
            representativeDTO.Id = representative.Id;
            return representativeDTO;
        }
        catch (ArgumentOutOfRangeException ex)
        {
            throw new ArgumentException($"Error converting to RepresentativeDTO: {ex.Message}");
        }
    }

    static public IEnumerable<RepresentativeDTO> ToDTO(IEnumerable<Representative> representatives)
    {
        List<RepresentativeDTO> representativeDTOs = new List<RepresentativeDTO>();
        foreach (Representative representative in representatives)
        {
            RepresentativeDTO representativeDTO = ToDTO(representative);
            representativeDTOs.Add(representativeDTO);
        }
        return representativeDTOs;
    }

}