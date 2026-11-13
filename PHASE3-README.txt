GSTTax Phase 3 - Purchase Order Receipt & Inventory Integration

Included changes:
- Purchase Order items can be linked to an Admin workspace Product Master item.
- Only an APPROVED Purchase Order can be marked RECEIVED.
- DRAFT, APPROVED, CLOSED and CANCELLED do not increase stock.
- On RECEIVED, each linked GOODS item increases its Product Master stock by the PO quantity.
- Receipt stock updates, movement records and PO status update happen in one database transaction.
- A unique inventory movement per PO item and a status guard prevent duplicate receipts.
- Product ownership is checked against the authenticated workspace.
- Inventory receipt history is available in the Purchase Order details view and GET /api/inventory/movements.
- Existing historical Purchase Orders are not automatically received or used to change stock.

Apply on Windows PowerShell from the project folder:
1. Back up your database first.
2. Extract this ZIP into your existing GSTTax project folder and allow it to replace the listed files.
3. Run:
   npx prisma validate
   npx prisma migrate deploy
   npx prisma generate
   npm run typecheck
   npm run build
4. Start the app and test with a new Purchase Order linked to a Product Master item.

Test flow:
- Create a Product Master item and note its stock.
- Create a Purchase Order and select that Product Master item in the Product Master dropdown.
- Save it as Draft: stock must not change.
- Approve it: stock must not change.
- Mark Received: stock must increase by the received PO quantity exactly once.
- Open the PO details: Inventory Receipt History should show quantity and before/after stock.
- Try marking it Received again (or send the request again): it must be rejected and stock must remain unchanged.
- Test with a different Admin workspace to confirm its products cannot be selected or updated.

Important:
- Existing Draft POs can be edited and linked to Product Master items before approval.
- Existing Approved POs whose lines were created before this patch have no product link. They must not be marked Received until each line has a Product Master link; use a new linked PO for the first test. This patch does not backfill historical records or change existing stock.
- Service lines do not change inventory. Goods lines must be linked to Product Master items before receipt.
- Do not run prisma migrate reset. Do not replace or share your .env file.

Validation note:
The source changes and migration SQL were reviewed, but a complete Prisma/TypeScript build could not be run in this environment because npm ci did not finish and the installed dependencies were incomplete. Run the commands above locally and share any error output for follow-up correction.
