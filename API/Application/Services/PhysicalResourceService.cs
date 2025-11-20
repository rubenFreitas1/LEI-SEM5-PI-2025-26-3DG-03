using Domain.IRepository;
using Domain.Model.Resources;
using Domain.Model;
using Application.DTO;
using Domain.Factory;
using ShippingManagement.Domain.Qualifications;
using System.Collections.Generic;
using System.Linq;

namespace Application.Services
{
    public class PhysicalResourceService
    {
        private readonly IPhysicalResourceRepository _repo;
        private readonly IQualificationRepository _qualificationRepository;
        private readonly IStorageAreaRepository _storageAreaRepository;
        private readonly IDockRepository _dockRepository;
        private readonly IPhysicalResourceFactory _factory;

        public PhysicalResourceService(IPhysicalResourceRepository repo, IQualificationRepository qualificationRepository, IStorageAreaRepository storageAreaRepository, IDockRepository dockRepository, IPhysicalResourceFactory factory)
        {
            _repo = repo;
            _qualificationRepository = qualificationRepository;
            _storageAreaRepository = storageAreaRepository;
            _dockRepository = dockRepository;
            _factory = factory;
        }

        public async Task<IEnumerable<PhysicalResourceDTO>> GetAll()
        {
            var resources = (await _repo.GetAllPhysicalResourcesAsync()) ?? Enumerable.Empty<PhysicalResource>();
            return resources.Select(r => PhysicalResourceDTO.ToDTO(r)).ToList();
        }

        public async Task<PhysicalResourceDTO?> GetById(long id)
        {
            var r = await _repo.GetPhysicalResourceByIdAsync(id);
            return r == null ? null : PhysicalResourceDTO.ToDTO(r);
        }

        public async Task<PhysicalResourceDTO?> GetByCode(string code)
        {
            var r = await _repo.GetPhysicalResourceByCodeAsync(code);
            return r == null ? null : PhysicalResourceDTO.ToDTO(r);
        }

        public async Task<IEnumerable<PhysicalResourceDTO>> GetByDescription(string description)
        {
            var r = (await _repo.GetPhysicalResourceByDescriptionAsync(description)) ?? Enumerable.Empty<PhysicalResource>();
            return r.Select(x => PhysicalResourceDTO.ToDTO(x)).ToList();
        }



        public async Task<IEnumerable<PhysicalResourceDTO>> GetByKind(PhysicalResourceKind kind)
        {
            var r = (await _repo.GetPhysicalResourceByKindAsync(kind)) ?? Enumerable.Empty<PhysicalResource>();
            return r.Select(x => PhysicalResourceDTO.ToDTO(x)).ToList();
        }

        public async Task<IEnumerable<PhysicalResourceDTO>> GetByStatus(ResourceStatus status)
        {
            var r = (await _repo.GetPhysicalResourceByStatusAsync(status)) ?? Enumerable.Empty<PhysicalResource>();
            return r.Select(x => PhysicalResourceDTO.ToDTO(x)).ToList();
        }

        public async Task<PhysicalResourceDTO?> Add(PhysicalResourceDTO dto, List<string> errorMessages)
        {

            var existing = await _repo.GetPhysicalResourceByCodeAsync(dto.Code);
            if (existing != null)
            {
                errorMessages.Add($"A resource with code '{dto.Code}' already exists.");
                return null;
            }


            if (!await ValidateAssignmentArea(dto.Kind, dto.AssignedArea, errorMessages))
            {
                return null;
            }

            IEnumerable<Qualification> qualifications = Enumerable.Empty<Qualification>();
            if (!string.IsNullOrWhiteSpace(dto.QualificationCode))
            {
                var qualification = await _qualificationRepository.GetQualificationByCodeAsync(dto.QualificationCode);
                if (qualification != null)
                {
                    qualifications = new List<Qualification> { qualification };
                }
            }

            try
            {
                var operationalWindow = OperationalWindowDTO.ToDomain(dto.OperationalWindow!);
                var resource = _factory.NewPhysicalResource(dto.Code, dto.Name, dto.Description, dto.Kind, qualifications, dto.OperationalCapacity, operationalWindow, dto.SetupTimeMinutes == 0 ? null : (int?)dto.SetupTimeMinutes);

                foreach (var qual in resource.Qualification) { }



                if (!string.IsNullOrWhiteSpace(dto.AssignedArea))
                {
                    if (dto.Kind == PhysicalResourceKind.STSCrane)
                        resource.AssignToDock(dto.AssignedArea);
                    else if (dto.Kind == PhysicalResourceKind.Truck)
                        resource.AssignToStorageArea(dto.AssignedArea);
                }
                var saved = await _repo.AddPhysicalResource(resource);
                if (saved == null)
                {
                    errorMessages.Add("Error mapping saved resource to domain.");
                    return null;
                }
                return PhysicalResourceDTO.ToDTO(saved);
            }
            catch (Exception ex)
            {
                errorMessages.Add("Error creating resource: " + ex.Message);
                return null;
            }
        }

        public async Task<bool> Update(long id, PhysicalResourceDTO dto, List<string> errorMessages)
        {
            var resource = await _repo.GetPhysicalResourceByIdAsync(id);
            if (resource == null)
            {
                errorMessages.Add("Resource not found");
                return false;
            }


            if (!string.Equals(resource.PhysicalResourceCode, dto.Code, StringComparison.OrdinalIgnoreCase))
            {
                var byCode = await _repo.GetPhysicalResourceByCodeAsync(dto.Code!);
                if (byCode != null && byCode.Id != id)
                {
                    errorMessages.Add($"A resource with code '{dto.Code}' already exists.");
                    return false;
                }
            }


            if (!await ValidateAssignmentArea(dto.Kind, dto.AssignedArea, errorMessages))
            {
                return false;
            }

            try
            {

                resource.ChangeName(dto.Name);
                resource.ChangeDescription(dto.Description);
                resource.ChangeKind(dto.Kind);
                resource.ChangeOperationalCapacity(dto.OperationalCapacity);
                resource.ChangeSetupTime(dto.SetupTimeMinutes == 0 ? null : (int?)dto.SetupTimeMinutes);


                if (!string.IsNullOrWhiteSpace(dto.AssignedArea))
                {
                    if (dto.Kind == PhysicalResourceKind.STSCrane)
                        resource.AssignToDock(dto.AssignedArea);
                    else if (dto.Kind == PhysicalResourceKind.Truck)
                        resource.AssignToStorageArea(dto.AssignedArea);
                }
                else if (dto.Kind == PhysicalResourceKind.MobileCrane)
                {
                    resource.RemoveAssignment();
                }

                if (!string.IsNullOrWhiteSpace(dto.QualificationCode))
                {
                    var qualification = await _qualificationRepository.GetQualificationByCodeAsync(dto.QualificationCode);
                    if (qualification != null)
                    {
                        resource.ChangeQualifications(new List<Qualification> { qualification });
                    }
                }


                if (dto.OperationalWindow != null)
                {
                    var operationalWindow = OperationalWindowDTO.ToDomain(dto.OperationalWindow);
                    resource.ChangeOperationalWindow(operationalWindow);
                }


                resource.ChangeStatus(dto.Status);

                var updated = await _repo.Update(resource, errorMessages);
                if (updated == null)
                {
                    errorMessages.Add("Error mapping updated resource to domain.");
                    return false;
                }
                return true;
            }
            catch (Exception ex)
            {
                errorMessages.Add("Error updating resource: " + ex.Message);
                return false;
            }
        }


        public async Task<IEnumerable<string>> GetAvailableDocks()
        {
            var docks = await _dockRepository.GetDocksAsync();
            return docks.Select(d => d.Name).Where(name => !string.IsNullOrEmpty(name))!;
        }


        public async Task<IEnumerable<string>> GetAvailableStorageAreas()
        {
            var storageAreas = await _storageAreaRepository.GetStorageAreasAsync();
            return storageAreas.Select(sa => sa.Code).Where(code => !string.IsNullOrEmpty(code))!;
        }

        private async Task<bool> ValidateAssignmentArea(PhysicalResourceKind kind, string? assignedArea, List<string> errorMessages)
        {
            if (string.IsNullOrWhiteSpace(assignedArea))
            {

                if (kind == PhysicalResourceKind.STSCrane)
                {
                    errorMessages.Add("STS Cranes must be assigned to a dock.");
                    return false;
                }
                else if (kind == PhysicalResourceKind.Truck)
                {
                    errorMessages.Add("Trucks must be assigned to a storage area.");
                    return false;
                }

                return true;
            }


            if (kind == PhysicalResourceKind.STSCrane)
            {
                var dock = await _dockRepository.GetDockByNameAsync(assignedArea);
                if (dock == null)
                {
                    errorMessages.Add($"Dock '{assignedArea}' does not exist. Please choose an existing dock.");
                    var availableDocks = await GetAvailableDocks();
                    errorMessages.Add($"Available docks: {string.Join(", ", availableDocks)}");
                    return false;
                }
            }
            else if (kind == PhysicalResourceKind.Truck)
            {
                var storageArea = await _storageAreaRepository.GetStorageAreaByCodeAsync(assignedArea);
                if (storageArea == null)
                {
                    errorMessages.Add($"Storage area '{assignedArea}' does not exist. Please choose an existing storage area.");
                    var availableAreas = await GetAvailableStorageAreas();
                    errorMessages.Add($"Available storage areas: {string.Join(", ", availableAreas)}");
                    return false;
                }
            }

            return true;
        }
    }
}
