"""Build the sixteen reference-derived card plates. Design inputs never enter dist."""
from pathlib import Path
import cv2, numpy as np, json, hashlib
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"public/deck-art/v1"
BOARDS={
'balatro':[(438,609,741,988,(458,753,725,860)),(101,609,405,988,(119,753,390,860)),(439,128,741,514,(458,279,726,382)),(101,128,405,514,(119,279,390,382))],
'gwent':[(861,251,1099,603,(878,395,1088,481)),(597,246,838,605,(614,395,825,481)),(322,232,588,613,(346,395,567,481)),(25,217,310,620,(62,395,288,481))],
'infernal':[(98,937,571,1125,(210,983,510,1080)),(98,714,575,917,(208,770,514,870)),(98,478,573,688,(208,545,515,647)),(99,229,576,457,(197,300,519,409))],
'occult':[(862,266,1112,663,(875,409,1100,526)),(600,266,848,663,(614,409,836,526)),(317,256,588,662,(335,409,572,526)),(11,252,300,662,(34,409,284,526))]
}
def make(src,crop,word):
    a=np.array(src.crop(crop).convert("RGB")); h,w=a.shape[:2]
    x0,y0,x1,y1=word;x0-=crop[0];x1-=crop[0];y0-=crop[1];y1-=crop[1]
    gray=cv2.cvtColor(a,cv2.COLOR_RGB2GRAY)
    mask=np.zeros((h,w),np.uint8); patch=gray[y0:y1,x0:x1]
    threshold=min(130,int(np.percentile(patch,85)*.76))
    mask[y0:y1,x0:x1]=np.where(patch<threshold,255,0)
    mask=cv2.dilate(mask,np.ones((5,5),np.uint8))
    clean=cv2.inpaint(a,mask,5,cv2.INPAINT_TELEA)
    rng=np.random.default_rng(42)
    smooth=cv2.GaussianBlur(clean,(0,0),4).astype(float)
    fill=np.clip(smooth+rng.normal(0,3.2,(h,w,1)),0,255)
    clean=np.where(mask[:,:,None]>0,fill,clean).astype(np.uint8)
    return a,clean,mask

def packed_map(a,family,level):
    # Height-derived normal XY and warm emissive mask, packed RGB.
    # This is an approximation to authored PBR maps, not a reconstruction of actual surface geometry.
    rgb=a.astype(np.float32)/255
    gray=cv2.GaussianBlur(cv2.cvtColor(rgb,cv2.COLOR_RGB2GRAY),(0,0),1.1)
    dx=cv2.Sobel(gray,cv2.CV_32F,1,0,ksize=3)*.65
    dy=cv2.Sobel(gray,cv2.CV_32F,0,1,ksize=3)*.65
    length=np.sqrt(dx*dx+dy*dy+1)
    nx=-dx/length;ny=dy/length
    h,w=a.shape[:2]; yy,xx=np.mgrid[:h,:w]
    edge=np.minimum.reduce([xx,w-1-xx,yy,h-1-yy])/min(h,w)
    rim=np.clip((.16-edge)/.12,0,1)
    warm=np.clip((rgb[:,:,0]-rgb[:,:,2]-.13)*3.2,0,1)*np.clip((rgb[:,:,0]-.36)*2.1,0,1)
    emission=warm*rim if (family in ("infernal","occult") or family=="balatro" and level==4) else np.zeros_like(gray)
    return np.uint8(np.clip(np.stack([nx*.5+.5,ny*.5+.5,emission],axis=2)*255,0,255))

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    report={}
    for family,rows in BOARDS.items():
        path=ROOT/"design/reference-decks"/(family+".jpg")
        source=Image.open(path).convert("RGB").resize((1122,1402),Image.Resampling.LANCZOS)
        source_hash=hashlib.sha256(path.read_bytes()).hexdigest()
        for level,(*crop,word) in enumerate(rows,1):
            original,clean,mask=make(source,tuple(crop),word)
            key=f"{family}-{level}";base=OUT/(key+".webp");normal=OUT/(key+"-map.webp")
            Image.fromarray(clean).save(base,quality=92,method=6)
            # Map retains high-frequency relief without forcing the base color to change.
            im=Image.fromarray(packed_map(clean,family,level))
            im.thumbnail((320,320),Image.Resampling.LANCZOS)
            im.save(normal,lossless=True,method=6)
            rendered=np.array(Image.open(base).convert("RGB")).astype(float)
            # Compare actual encoded plate to concept crop only outside replaced word ink.
            # Report normalized pixel agreement and MAE, NOT overall design fidelity.
            diff=np.abs(rendered-original.astype(float))[mask==0]
            agreement=float(1-diff.mean()/255)
            report[key]={"sourceSha256":source_hash,"crop":crop,"wordMaskFraction":round(float((mask>0).mean()),4),"platePixelAgreementOutsideWord":round(agreement,5),"meanAbsoluteColorError":round(float(diff.mean()),3),"plateBytes":base.stat().st_size,"mapBytes":normal.stat().st_size}
            if agreement<.95:raise RuntimeError(f"{key}: plate reference preservation below 95%")
    total=sum(v["plateBytes"]+v["mapBytes"] for v in report.values())
    if total>2*1024*1024:raise RuntimeError(f"art budget exceeded: {total}")
    (OUT/"manifest.json").write_text(json.dumps(report,indent=2)+"\n")
    print(f"16 card plates + packed maps: {total} bytes; minimum outside-word pixel agreement {min(v['platePixelAgreementOutsideWord'] for v in report.values()):.4%}")
if __name__=="__main__":main()
