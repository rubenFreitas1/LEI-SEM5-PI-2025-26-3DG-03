using Domain.IRepository;
using Application.DTO;
using ShippingManagement.Domain.Qualifications;

namespace Application.Services
{
    public class QualificationService
    {
        private readonly IQualificationRepository _qualificationRepository;

        public QualificationService(IQualificationRepository qualificationRepository)
        {
            _qualificationRepository = qualificationRepository;
        }

        public async Task<IEnumerable<QualificationDTO>> GetAllQualifications()
        {
            IEnumerable<Qualification> qs = await _qualificationRepository.GetQualificationsAsync();
            return QualificationDTO.ToDTO(qs);
        }

        public async Task<IEnumerable<QualificationDTO>> GetByName(string name)
        {
            var qs = await _qualificationRepository.GetQualificationsByNameAsync(name);
            return QualificationDTO.ToDTO(qs);
        }

        public async Task<QualificationDTO?> GetByCode(string code)
        {
            var q = await _qualificationRepository.GetQualificationByCodeAsync(code);
            if (q == null) return null;
            return QualificationDTO.ToDTO(q);
        }

        public async Task<QualificationDTO?> AddQualification(QualificationDTO dto, List<string> errorMessages)
        {

            if (dto == null)
            {
                errorMessages.Add("Qualification data is required.");
                return null;
            }

            if (string.IsNullOrWhiteSpace(dto.Code))
            {
                errorMessages.Add("Qualification code is required.");
                return null;
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                errorMessages.Add("Qualification name is required.");
                return null;
            }


            if (await _qualificationRepository.QualificationCodeExistsAsync(dto.Code!))
            {
                errorMessages.Add($"A qualification with code '{dto.Code}' already exists.");
                return null;
            }

            if (await _qualificationRepository.QualificationNameExistsAsync(dto.Name!))
            {
                errorMessages.Add($"A qualification with name '{dto.Name}' already exists.");
                return null;
            }


            Qualification domain;
            try
            {
                domain = QualificationDTO.ToDomain(dto);
            }
            catch (ArgumentException ex)
            {
                errorMessages.Add(ex.Message);
                return null;
            }

            var saved = await _qualificationRepository.AddQualificationAsync(domain);
            return QualificationDTO.ToDTO(saved);
        }

        public async Task<bool> UpdateQualification(QualificationDTO dto, List<string> errorMessages)
        {
            if (dto == null || dto.Id == null)
            {
                errorMessages.Add("Qualification id is required for update.");
                return false;
            }

            var existing = await _qualificationRepository.GetQualificationByIdAsync(dto.Id.Value);
            if (existing == null)
            {
                errorMessages.Add("Qualification not found.");
                return false;
            }


            if (!string.IsNullOrWhiteSpace(dto.Code) && !dto.Code!.Equals(existing.Code, StringComparison.OrdinalIgnoreCase))
            {
                if (await _qualificationRepository.QualificationCodeExistsAsync(dto.Code!))
                {
                    errorMessages.Add($"Another qualification with code '{dto.Code}' already exists.");
                    return false;
                }
            }


            if (!string.IsNullOrWhiteSpace(dto.Name) && !dto.Name!.Equals(existing.Name, StringComparison.OrdinalIgnoreCase))
            {
                if (await _qualificationRepository.QualificationNameExistsAsync(dto.Name!))
                {
                    errorMessages.Add($"Another qualification with name '{dto.Name}' already exists.");
                    return false;
                }
            }

            try
            {
                QualificationDTO.UpdateToDomain(existing, dto);
            }
            catch (ArgumentException ex)
            {
                errorMessages.Add(ex.Message);
                return false;
            }

            var updated = await _qualificationRepository.UpdateQualificationAsync(existing, errorMessages);
            return errorMessages.Count == 0 && updated != null;
        }

        public async Task<bool> UpdateQualificationNameAndDescription(long id, QualificationUpdateDTO dto, List<string> errorMessages)
        {
            if (dto == null)
            {
                errorMessages.Add("Qualification update data is required.");
                return false;
            }

            var existing = await _qualificationRepository.GetQualificationByIdAsync(id);
            if (existing == null)
            {
                errorMessages.Add("Qualification not found.");
                return false;
            }

            // Only check for name uniqueness if name is being changed
            if (!string.IsNullOrWhiteSpace(dto.Name) && !dto.Name!.Equals(existing.Name, StringComparison.OrdinalIgnoreCase))
            {
                if (await _qualificationRepository.QualificationNameExistsAsync(dto.Name!))
                {
                    errorMessages.Add($"Another qualification with name '{dto.Name}' already exists.");
                    return false;
                }
            }

            try
            {
                QualificationUpdateDTO.UpdateToDomain(existing, dto);
            }
            catch (ArgumentException ex)
            {
                errorMessages.Add(ex.Message);
                return false;
            }

            var updated = await _qualificationRepository.UpdateQualificationAsync(existing, errorMessages);
            return errorMessages.Count == 0 && updated != null;
        }
    }
}
