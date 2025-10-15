namespace Application.DTO;

using Domain.Model;
using ShippingManagement.Domain.Qualifications;

public class StaffDTO
{
    public long? Id { get; set; }
    public string? Name { get; set; }
    public IEnumerable<string>? QualificationCodes { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }

    public StaffDTO() { }
    public StaffDTO(long id, string name, IEnumerable<string>? qualificationCodes, string email, string phone)
    {
        Id = id;
        Name = name;
        QualificationCodes = qualificationCodes;
        Email = email;
        Phone = phone;
    }
    public static StaffDTO ToDTO(Staff s)
    {
        IEnumerable<string>? qualCodes = s.Qualification?.Select(q => q.Code).ToList();
        try
        {
            StaffDTO staffDTO = new StaffDTO(s.Id!, s.Name!, qualCodes, s.Email, s.Phone);
            return staffDTO;
        }
        catch (ArgumentOutOfRangeException ex)
        {
            throw new ArgumentException($"Error converting to StaffDTO: {ex.Message}");
        }
    }

    public static Staff ToDomain(StaffDTO dto, IEnumerable<Qualification> qualifications)
    {
        if (dto.QualificationCodes == null || !dto.QualificationCodes.Any())
            throw new InvalidOperationException("At least one QualificationCode must be provided to create a Staff.");

        if (dto.Name is null)
            throw new InvalidOperationException("Name cannot be null.");

        if (dto.Email is null)
            throw new InvalidOperationException("Email cannot be null.");

        if (dto.Phone is null)
            throw new InvalidOperationException("Phone number cannot be null.");

        return new Staff(dto.Name!, qualifications, dto.Email!, dto.Phone!);
    }
}