<?php
namespace App\Http\Controllers\Api\V1;
use App\Http\Controllers\Controller;
use App\Http\Requests\SupplierRequest;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;
class SupplierController extends Controller {
    public function index() { return response()->json(['success'=>true,'data'=>Supplier::withCount('inventoryItems')->latest()->paginate(25)]); }
    public function store(SupplierRequest $r) { return response()->json(['success'=>true,'data'=>Supplier::create($r->validated())],201); }
    public function show(Supplier $supplier) { return response()->json(['success'=>true,'data'=>$supplier->load('inventoryItems')]); }
    public function update(SupplierRequest $r,Supplier $supplier) { $supplier->update($r->validated()); return response()->json(['success'=>true,'data'=>$supplier->fresh()]); }
    public function destroy(Supplier $supplier) { DB::transaction(fn()=> $supplier->delete()); return response()->json(['success'=>true]); }
}
