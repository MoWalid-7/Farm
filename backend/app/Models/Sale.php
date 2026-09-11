<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Sale extends Model {
    protected $fillable=['customer_id','cycle_id','quantity','weight','price','total_amount','paid_amount','remaining_amount','sale_date'];
    protected $casts=['quantity'=>'integer','weight'=>'decimal:3','price'=>'decimal:2','total_amount'=>'decimal:2','paid_amount'=>'decimal:2','remaining_amount'=>'decimal:2','sale_date'=>'date'];
    public function customer(){return $this->belongsTo(Customer::class);}
    public function cycle(){return $this->belongsTo(Cycle::class);}
}
