using ShippingManagement.Domain.Qualifications;

namespace Application.DTO
{
    public class QualificationUpdateDTO
    {
        public string? Name { get; set; }
        public string? Description { get; set; }

        public static void UpdateToDomain(Qualification q, QualificationUpdateDTO dto)
        {
            if (!string.IsNullOrWhiteSpace(dto.Name)) q.ChangeName(dto.Name!);
            q.ChangeDescription(dto.Description ?? string.Empty);
        }
    }
}