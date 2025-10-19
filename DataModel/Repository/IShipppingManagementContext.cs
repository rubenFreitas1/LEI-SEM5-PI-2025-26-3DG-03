namespace DataModel.Repository;

using Microsoft.EntityFrameworkCore;

using DataModel.Model;
using Domain.Model;

public interface IShippingManagementContext
{
    DbSet<VesselTypeDataModel> VesselTypes { get; set; }
    DbSet<DockDataModel> Docks { get; set; }

    DbSet<VesselRecordDataModel> VesselRecords { get; set; }

    DbSet<QualificationDataModel> Qualifications { get; set; }

    DbSet<StaffDataModel> Staffs { get; set; }

    DbSet<StorageAreaDataModel> StorageAreas { get; set; }
    DbSet<StorageAreaDockDataModel> StorageAreaDocks { get; set; }
}