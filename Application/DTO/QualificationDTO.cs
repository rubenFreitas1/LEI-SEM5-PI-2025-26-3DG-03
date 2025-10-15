using System.Collections.Generic;
using System.Linq;
using ShippingManagement.Domain.Qualifications;

namespace Application.DTO
{
    public class QualificationDTO
    {
        public long? Id { get; set; }
        public string? Code { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }

        public static QualificationDTO ToDTO(Qualification q)
        {
            return new QualificationDTO
            {
                Id = q.Id,
                Code = q.Code,
                Name = q.Name,
                Description = q.Description
            };
        }

        public static IEnumerable<QualificationDTO> ToDTO(IEnumerable<Qualification> qs)
        {
            return qs.Select(q => ToDTO(q));
        }

        public static Qualification ToDomain(QualificationDTO dto)
        {
            return new Qualification(dto.Code!, dto.Name!, dto.Description!);
        }

        public static IEnumerable<Qualification> ToDomain(IEnumerable<QualificationDTO> dto)
        {
            return dto.Select(dto => ToDomain(dto));
        }

        public static void UpdateToDomain(Qualification q, QualificationDTO dto)
        {

            if (!string.IsNullOrWhiteSpace(dto.Name)) q.ChangeName(dto.Name!);
            if (!string.IsNullOrWhiteSpace(dto.Description)) q.ChangeDescription(dto.Description!);
        }
    }
}
