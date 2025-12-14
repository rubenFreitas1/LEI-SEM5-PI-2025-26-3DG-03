using Microsoft.EntityFrameworkCore;

namespace DataModel.Configurations;

using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class DataRequestConfiguration : IEntityTypeConfiguration<DataRequestDataModel>
{
    public void Configure(EntityTypeBuilder<DataRequestDataModel> builder)
    {
        builder.HasKey(dr => dr.Id);

        builder.Property(dr => dr.RequestType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(dr => dr.SystemUserEmail)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(dr => dr.RequestStatus)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(dr => dr.Details)
            .HasMaxLength(500);
    }
}