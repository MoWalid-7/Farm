<?php
namespace App\Http\Controllers\Api\V1;
use App\Http\Controllers\Controller; use App\Http\Requests\SaleRequest; use App\Models\Sale; use App\Services\PhaseThreeService;
class SaleController extends Controller {
 public function index(){return response()->json(['success'=>true,'data'=>Sale::with(['customer','cycle'])->latest('sale_date')->paginate(25)]);}
 public function store(SaleRequest $r,PhaseThreeService $s){return response()->json(['success'=>true,'data'=>$s->sale($r->validated())],201);}
 public function show(Sale $sale){return response()->json(['success'=>true,'data'=>$sale->load(['customer','cycle'])]);}
 public function update(SaleRequest $r,Sale $sale,PhaseThreeService $s){return response()->json(['success'=>true,'data'=>$s->sale($r->validated(),$sale)]);}
 public function destroy(Sale $sale,PhaseThreeService $s){$s->delete($sale);return response()->json(['success'=>true]);}
}
