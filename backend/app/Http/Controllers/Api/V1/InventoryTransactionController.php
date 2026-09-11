<?php
namespace App\Http\Controllers\Api\V1;
use App\Http\Controllers\Controller;
use App\Http\Requests\InventoryTransactionRequest;
use App\Models\InventoryTransaction;
use App\Services\InventoryService;
class InventoryTransactionController extends Controller {
    public function adjust(\Illuminate\Http\Request $request, \App\Models\InventoryItem $inventoryItem, InventoryService $s) {
        $data = $request->validate(['quantity'=>['required','numeric','not_in:0'],'notes'=>['nullable','string'],'transaction_date'=>['required','date']]);
        return response()->json(['success'=>true,'data'=>$s->transaction(array_merge($data,['inventory_item_id'=>$inventoryItem->id,'type'=>'adjustment']))],201);
    }
    public function index() { return response()->json(['success'=>true,'data'=>InventoryTransaction::with('inventoryItem')->latest('transaction_date')->paginate(25)]); }
    public function store(InventoryTransactionRequest $r,InventoryService $s) { return response()->json(['success'=>true,'data'=>$s->transaction($r->validated())],201); }
    public function show(InventoryTransaction $inventoryTransaction) { return response()->json(['success'=>true,'data'=>$inventoryTransaction->load('inventoryItem')]); }
    public function update(InventoryTransactionRequest $r,InventoryTransaction $inventoryTransaction,InventoryService $s) { return response()->json(['success'=>true,'data'=>$s->transaction($r->validated(),$inventoryTransaction)]); }
    public function destroy(InventoryTransaction $inventoryTransaction,InventoryService $s) { $s->deleteTransaction($inventoryTransaction); return response()->json(['success'=>true]); }
}
