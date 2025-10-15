namespace Application.DTO;

using Domain.Model;
using ShippingManagement.Domain.Qualifications;

public class StaffDTO
{
    public long? Id { get; set; }
    public string? Name { get; set; }
    public IEnumerable<QualificationDTO>? Qualification { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }

    public StaffDTO() { }
    public StaffDTO(long id, string name, IEnumerable<QualificationDTO> qualification, string email, string phone)
    {
        Id = id;
        Name = name;
        Qualification = qualification;
        Email = email;
        Phone = phone;
    }
    public static StaffDTO ToDTO(Staff s)
    {
        IEnumerable<QualificationDTO> qualification = QualificationDTO.ToDTO(s.Qualification);
        try
        {
            StaffDTO staffDTO = new StaffDTO(s.Id!, s.Name!, qualification!, s.Email, s.Phone);
            return staffDTO;
        }
        catch (ArgumentOutOfRangeException ex)
        {
            throw new ArgumentException($"Error converting to VesselTypeDTO: {ex.Message}");
        }
    }

    public static Staff ToDomain(StaffDTO dto)
    {
        if (dto.Qualification is null)
            throw new InvalidOperationException("Qualification must be provided to create a Staff.");
        
        if (dto.Name is null)
            throw new InvalidOperationException("Name cannot be null.");
        
        if (dto.Email is null)
            throw new InvalidOperationException("Email cannot be null.");
        
        if (dto.Phone is null)
            throw new InvalidOperationException("Phone number cannot be null.");
            
        IEnumerable<Qualification> qualification = QualificationDTO.ToDomain(dto.Qualification!);
        return new Staff(dto.Name!, qualification, dto.Email!, dto.Phone!);
    }
}