<?php
namespace App\Services;
use App\Models\{Cycle,Weight,Customer,Sale};
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
class PhaseThreeService {
    public function cycle(array $d, ?Cycle $m=null): Cycle { return DB::transaction(function()use($d,$m){$m?$m->update($d):$m=Cycle::create($d);return $m->fresh();});}
    public function weight(array $d, ?Weight $m=null): Weight { return DB::transaction(function()use($d,$m){$d['average_weight']=round((float)$d['total_weight']/(int)$d['bird_count'],3);$m?$m->update($d):$m=Weight::create($d);return $m->fresh('cycle');});}
    public function customer(array $d, ?Customer $m=null): Customer { return DB::transaction(function()use($d,$m){$m?$m->update($d):$m=Customer::create($d);return $m->fresh();});}
    public function sale(array $d, ?Sale $m=null): Sale { return DB::transaction(function()use($d,$m){
        // Total = Weight * Price (quantity is stored as informational field only)
        $d['total_amount']=round((float)$d['weight']*(float)$d['price'],2);
        $d['paid_amount']=round((float)($d['paid_amount']??0),2);
        if($d['paid_amount']>$d['total_amount']) throw ValidationException::withMessages(['paid_amount'=>['المبلغ المدفوع لا يمكن أن يتجاوز إجمالي قيمة البيع.']]);
        $d['remaining_amount']=round($d['total_amount']-$d['paid_amount'],2);
        // Determine payment status
        if($d['paid_amount']>=$d['total_amount']){ $d['payment_status']='paid'; }
        elseif($d['paid_amount']>0){ $d['payment_status']='partially_paid'; }
        else { $d['payment_status']='unpaid'; }
        $m?$m->update($d):$m=Sale::create($d);return $m->fresh(['customer','cycle']);
    });}
    public function delete($m):void {DB::transaction(fn()=>$m->delete());}
}
