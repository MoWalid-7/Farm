<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Weight extends Model {
    protected $fillable=['cycle_id','bird_count','total_weight','average_weight','recorded_date'];
    protected $casts=['bird_count'=>'integer','total_weight'=>'decimal:3','average_weight'=>'decimal:3','recorded_date'=>'date'];
    public function cycle(){return $this->belongsTo(Cycle::class);}
}
