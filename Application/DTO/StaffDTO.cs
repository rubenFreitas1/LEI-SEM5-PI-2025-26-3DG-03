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
    public OperationalWindowDTO? OperationalWindow { get; set; }
    public ResourceStatus? Status { get; set; }

    public StaffDTO() { }
    public StaffDTO(long id, string name, IEnumerable<string>? qualificationCodes, string email, string phone, OperationalWindowDTO operationalWindow, ResourceStatus status)
    {
        Id = id;
        Name = name;
        QualificationCodes = qualificationCodes;
        Email = email;
        Phone = phone;
        OperationalWindow = operationalWindow;
        Status = status;
    }
    public static StaffDTO ToDTO(Staff s)
    {
        IEnumerable<string>? qualCodes = s.Qualification?.Select(q => q.Code).Where(c => c != null).Select(c => c!).Distinct().ToList();
        try
        {
            OperationalWindowDTO opWindowDTO = OperationalWindowDTO.ToDTO(s.OperationalWindow!);
            StaffDTO staffDTO = new StaffDTO(s.Id!, s.Name!, qualCodes, s.Email, s.Phone, opWindowDTO, s.Status);
            return staffDTO;
        }
        catch (ArgumentOutOfRangeException ex)
        {
            throw new ArgumentException($"Error converting to StaffDTO: {ex.Message}");
        }
    }

    public static Staff ToDomain(StaffDTO dto, IEnumerable<Qualification> qualifications, OperationalWindow operationalWindow)
    {
        if (dto.QualificationCodes == null || !dto.QualificationCodes.Any())
            throw new InvalidOperationException("At least one QualificationCode must be provided to create a Staff.");

        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new InvalidOperationException("Name cannot be null.");

        if (string.IsNullOrWhiteSpace(dto.Email))
            throw new InvalidOperationException("Email cannot be null.");

        if (string.IsNullOrWhiteSpace(dto.Phone))
            throw new InvalidOperationException("Phone number cannot be null.");

        if (dto.OperationalWindow is null)
            throw new InvalidOperationException("OperationalWindow cannot be null.");

        ResourceStatus status = dto.Status ?? ResourceStatus.Available;

        return new Staff(dto.Name!, qualifications, dto.Email!, dto.Phone!, operationalWindow, status);
    }
}