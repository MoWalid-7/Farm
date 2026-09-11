<?php
namespace App\Http\Controllers\Api\V1;
use App\Http\Controllers\Controller;
use App\Http\Requests\InventoryItemRequest;
use App\Models\InventoryItem;
use App\Services\InventoryService;
class InventoryItemController extends Controller {
    public function index() { return response()->json(['success'=>true,'data'=>InventoryItem::with('supplier')->paginate(25)]); }
    public function store(InventoryItemRequest $r,InventoryService $s) { return response()->json(['success'=>true,'data'=>$s->item($r->validated())],201); }
    public function show(InventoryItem $inventoryItem) { return response()->json(['success'=>true,'data'=>$inventoryItem->load(['supplier','transactions'])]); }
    public function update(InventoryItemRequest $r,InventoryItem $inventoryItem,InventoryService $s) { return response()->json(['success'=>true,'data'=>$s->item($r->validated(),$inventoryItem)]); }
    public function destroy(InventoryItem $inventoryItem) { $inventoryItem->delete(); return response()->json(['success'=>true]); }
    public function lowStock() { return response()->json(['success'=>true,'data'=>InventoryItem::with('supplier')->get()->filter(fn($i)=>$i->is_low_stock)->values()]); }
}
