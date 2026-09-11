<?php
namespace App\Http\Controllers\Api\V1;
use App\Http\Controllers\Controller;
use App\Http\Requests\CustomerRequest;
use App\Models\Customer;
use App\Services\PhaseThreeService;
class CustomerController extends Controller {
 public function index(\Illuminate\Http\Request $r){
  $q = Customer::withSum('sales','total_amount')
       ->withSum('sales','paid_amount')
       ->withSum('sales','remaining_amount')
       ->withCount('sales')
       ->latest();
  if($search=$r->query('search')){
   $q->where(function($q2)use($search){
    $q2->where('name','like',"%{$search}%")
       ->orWhere('phone','like',"%{$search}%");
   });
  }
  return response()->json(['success'=>true,'data'=>$q->paginate((int)($r->query('per_page',25)))]);
 }
 public function store(CustomerRequest $r,PhaseThreeService $s){return response()->json(['success'=>true,'data'=>$s->customer($r->validated())],201);}
 public function show(Customer $customer){
  $customer->loadSum('sales','total_amount')
           ->loadSum('sales','paid_amount')
           ->loadSum('sales','remaining_amount');
  return response()->json(['success'=>true,'data'=>$customer->load('sales.cycle')]);
 }
 public function update(CustomerRequest $r,Customer $customer,PhaseThreeService $s){return response()->json(['success'=>true,'data'=>$s->customer($r->validated(),$customer)]);}
 public function destroy(Customer $customer,PhaseThreeService $s){$s->delete($customer);return response()->json(['success'=>true]);}
}

