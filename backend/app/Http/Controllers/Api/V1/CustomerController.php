<?php
namespace App\Http\Controllers\Api\V1;
use App\Http\Controllers\Controller; use App\Http\Requests\CustomerRequest; use App\Models\Customer; use App\Services\PhaseThreeService;
class CustomerController extends Controller {
 public function index(){return response()->json(['success'=>true,'data'=>Customer::latest()->paginate(25)]);}
 public function store(CustomerRequest $r,PhaseThreeService $s){return response()->json(['success'=>true,'data'=>$s->customer($r->validated())],201);}
 public function show(Customer $customer){return response()->json(['success'=>true,'data'=>$customer->load('sales')]);}
 public function update(CustomerRequest $r,Customer $customer,PhaseThreeService $s){return response()->json(['success'=>true,'data'=>$s->customer($r->validated(),$customer)]);}
 public function destroy(Customer $customer,PhaseThreeService $s){$s->delete($customer);return response()->json(['success'=>true]);}
}
