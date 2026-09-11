<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class SaleRequest extends FormRequest {
    public function authorize(): bool{return true;}
    protected function prepareForValidation(): void { $this->merge(array_filter(['weight'=>$this->weight??$this->weight_per_bird,'price'=>$this->price??$this->price_per_kg],fn($v)=>$v!==null)); }
    public function rules(): array{return ['customer_id'=>['required','exists:customers,id'],'cycle_id'=>['nullable','exists:cycles,id'],'quantity'=>['required','integer','min:1'],'weight'=>['required','numeric','gt:0'],'price'=>['required','numeric','gt:0'],'paid_amount'=>['sometimes','numeric','min:0'],'sale_date'=>['required','date']];}
}
