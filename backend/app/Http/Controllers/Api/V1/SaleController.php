<?php
namespace App\Http\Controllers\Api\V1;
use App\Http\Controllers\Controller;
use App\Http\Requests\SaleRequest;
use App\Models\Sale;
use App\Services\PhaseThreeService;
class SaleController extends Controller {
 public function index(\Illuminate\Http\Request $r){
  $q = Sale::with(['customer','cycle'])->latest('sale_date');
  if($s=$r->query('search')){
   $q->where(function($q2)use($s){
    $q2->where('id','like',"%{$s}%")
       ->orWhereHas('customer',fn($c)=>$c->where('name','like',"%{$s}%")->orWhere('phone','like',"%{$s}%"));
   });
  }
  if($customerId=$r->query('customer_id')) $q->where('customer_id',$customerId);
  if($status=$r->query('status')) $q->where('payment_status',$status);
  if($from=$r->query('date_from')) $q->whereDate('sale_date','>=',$from);
  if($to=$r->query('date_to')) $q->whereDate('sale_date','<=',$to);
  return response()->json(['success'=>true,'data'=>$q->paginate((int)($r->query('per_page',25)))]);
 }
 public function store(SaleRequest $r,PhaseThreeService $s){return response()->json(['success'=>true,'data'=>$s->sale($r->validated())],201);}
 public function show(Sale $sale){return response()->json(['success'=>true,'data'=>$sale->load(['customer','cycle'])]);}
 public function update(SaleRequest $r,Sale $sale,PhaseThreeService $s){return response()->json(['success'=>true,'data'=>$s->sale($r->validated(),$sale)]);}
 public function destroy(Sale $sale,PhaseThreeService $s){$s->delete($sale);return response()->json(['success'=>true]);}
}

