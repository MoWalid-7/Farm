<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Cycle extends Model {
    use HasFactory;
    protected $fillable=['name','start_date','end_date','bird_count','status'];
    protected $casts=['start_date'=>'date','end_date'=>'date','bird_count'=>'integer'];
    public function weights(){return $this->hasMany(Weight::class);}
    public function sales(){return $this->hasMany(Sale::class);}
}
