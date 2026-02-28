using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddPurchaseProductOrderTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PurchaseProductOrders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PurchaseOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ImportedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    CheckedUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseProductOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurchaseProductOrders_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PurchaseProductOrders_PurchaseOrders_PurchaseOrderId",
                        column: x => x.PurchaseOrderId,
                        principalTable: "PurchaseOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PurchaseProductOrders_Users_CheckedUserId",
                        column: x => x.CheckedUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c2d"),
                column: "Password",
                value: "$2a$11$.J1sFDKUXH9GkAPDTZhs6..0hGuULnnNnDuRHCrqU1QZFnfLGSGR6");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseProductOrders_CheckedUserId",
                table: "PurchaseProductOrders",
                column: "CheckedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseProductOrders_ProductId",
                table: "PurchaseProductOrders",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseProductOrders_PurchaseOrderId",
                table: "PurchaseProductOrders",
                column: "PurchaseOrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PurchaseProductOrders");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c2d"),
                column: "Password",
                value: "$2a$11$lIo2zHOe3QCI360h.GYGRezLOmg7FMREblEEreBoqAYO32LKgOYly");
        }
    }
}
