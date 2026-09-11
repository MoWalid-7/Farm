<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class InventoryTransactionRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { $adjustment=$this->input('type')==='adjustment'; return ['inventory_item_id'=>['required','exists:inventory_items,id'],'type'=>['required','in:purchase,usage,sale,waste,return,in,out,adjustment'],'quantity'=>array_merge(['required','numeric'],$adjustment?['not_in:0']:['gt:0']),'reference'=>['nullable','string','max:255'],'notes'=>['nullable','string'],'transaction_date'=>['required','date']]; }
}
