import classNames from "./index.css";
import SketchPicker from "react-color/lib/Sketch";
import { Popover, Slider, Button, Switch, Upload, Modal, Input } from "antd";
import { scaleLinear } from "d3-scale";
import { pairs } from "d3-array";
import { useRef, useEffect, useState } from "react";
import { connect } from "dva";

function Number({ value, onChange, range = [0, 100] }) {
  const styles = {
    container: {
      width: 200,
    },
  };

  const step = ((range[1] - range[0]) / 5) | 0;
  const marks = {};
  let i = 0;
  do {
    marks[i] = i;
    i += step;
  } while (i <= range[1]);

  return (
    <div style={styles.container}>
      <Slider
        defaultValue={0}
        min={range[0]}
        max={range[1]}
        value={value}
        onChange={onChange}
        marks={marks}
      />
    </div>
  );
}

function MultipleSlider({ value, onChange }) {
  const width = 200;
  const dots = [];
  const total = value.reduce((sum, n) => {
    dots.push(sum);
    sum += n;
    return sum;
  });
  const ref = useRef(null);
  const move = useRef(-1);
  const scale = scaleLinear()
    .domain([0, total])
    .range([0, width]);

  const styles = {
    slider: {
      width,
    },
    container: {
      width,
    },
  };

  function handleMove(e) {
    const index = move.current;
    if (index === -1) return;
    const { left } = ref.current.getBoundingClientRect();
    const { clientX } = e;
    const mouseX = clientX - left;
    const v = scale.invert(mouseX);
    const all = [0, ...dots, total];
    if (v >= all[index + 2] || v <= all[index]) return;
    all.splice(index + 1, 1, v); // 替换新的值
    const newValue = pairs(all).map(([a, b]) => b - a);
    onChange(newValue);
  }

  function handlerUp() {
    move.current = -1;
  }

  useEffect(() => {
    window.addEventListener("mouseup", handlerUp);
    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mouseup", handlerUp);
      window.removeEventListener("mousemove", handleMove);
    };
  });

  return (
    <div className={classNames.sliderContainer} style={styles.container}>
      <div className={classNames.slider} style={styles.slider} ref={ref}>
        {dots.map((dot, index) => (
          <div
            key={index}
            className={classNames.dot}
            style={{
              left: scale(dot) - 7,
            }}
            onMouseDown={() => (move.current = index)}
          />
        ))}
      </div>
    </div>
  );
}

function Color({ value, onChange }) {
  const styles = {
    container: {
      width: 220,
      height: 309,
      left: -110,
      top: -300,
      position: "absolute",
    },
  };
  return (
    <div style={styles.container}>
      <SketchPicker
        color={value}
        onChangeComplete={(color) => onChange(color.hex)}
        style={{ background: "transparent" }}
      />
    </div>
  );
}

function MyRadio({ value, onChange, list, hasIcon = true }) {
  const styles = {
    button: {
      margin: "0.25em",
    },
  };
  return (
    <div>
      {list.map((item) => (
        <Button
          style={styles.button}
          icon={hasIcon ? item.icon : ""}
          key={item.value}
          type={value === item.value ? "primary" : "default"}
          onClick={() => {
            if (value === item.value) return;
            onChange(item.value);
          }}
          size="small"
        >
          {!hasIcon && item.name}
        </Button>
      ))}
    </div>
  );
}

function _MyImage({ onChange, value, locales, lang }) {
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const ref = useRef(null);

  function handleImageChange(data) {
    const file = data.file.originFileObj;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function() {
      const imageURL = reader.result;
      onChange(imageURL);
    };
  }

  function handleOnOk(e) {
    const input = ref.current;
    const value = input.state.value;
    if (value && value !== "") {
      onChange(value);
      setShow(false);
    } else {
      setError(true);
    }
    e.stopPropagation();
  }

  function handleChange(value) {
    if (value && value !== "" && error) setError(false);
  }

  return (
    <ul className={classNames.list}>
      <li className={classNames.item}>
        <Upload
          accept="image/*"
          onChange={handleImageChange}
          showUploadList={false}
          customRequest={() => {}}
        >
          <span className={classNames.fileText}>
            {locales.LOCAL_IMAGE[lang]}
          </span>
        </Upload>
      </li>
      <li className={classNames.item} onClick={() => setShow(true)}>
        {locales.NETWORK_IMAGE[lang]}
        <Modal
          title={locales.INPUT_IMAGE_URL[lang]}
          visible={show}
          onOk={handleOnOk}
          onCancel={(e) => {
            setShow(false);
            e.stopPropagation();
          }}
          okText={locales.CONFIRM[lang]}
          cancelText={locales.CANCEL[lang]}
        >
          <Input type="text" ref={ref} onChange={handleChange} />
          {error && (
            <p className={classNames.error}>
              {locales.NO_EMPTY_IMAGE_URL[lang]}
            </p>
          )}
        </Modal>
      </li>
    </ul>
  );
}

export const MyImage = connect(({ global }) => ({
  locales: global.locales,
  lang: global.lang,
}))(_MyImage);

export default function({
  type,
  value,
  onChange,
  range,
  list,
  yes,
  hasIcon,
  disabled,
}) {
  const styles = {
    color: {
      background: value,
    },
    colorContainer: {
      width: 0,
      height: 0,
    },
  };

  const nameByValue = (value) =>
    list && list.find((item) => item.value === value).name;

  const contentByType = {
    color: <Color value={value} onChange={onChange} />,
    number: <Number range={range} value={value} onChange={onChange} />,
    array: <MultipleSlider value={value} onChange={onChange} />,
    radio: (
      <MyRadio
        value={value}
        onChange={onChange}
        list={list}
        hasIcon={hasIcon}
      />
    ),
    image: <MyImage value={value} onChange={onChange} />,
  };
  
  const boxByType = {
    color: <div className={classNames.inputBox} style={styles.color} />,
    radio: <div className={classNames.inputBox}>{nameByValue(value)}</div>,
    switch: (
      <Switch
        checked={value === yes}
        onChange={(v) => (value === yes ? onChange("") : onChange(yes))}
      />
    ),
    array: (
      <div className={classNames.inputBox}>
        {value instanceof Array &&
          value.map((d) => parseFloat(d.toFixed(2))).join(":")}
      </div>
    ),
    image: <Button icon="upload" type="primary" />,
    number: (
      <input
        type="number"
        className={classNames.inputBox}
        style={styles.number}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ),
  };
  return (
    <div className={classNames.main}>
      {type === "switch" ? (
        boxByType[type]
      ) : type === "radio" ? (
        contentByType[type]
      ) : (
        <Popover
          content={contentByType[type]}
          trigger="click"
          overlayStyle={type === "color" ? styles.colorContainer : {}}
        >
          {boxByType[type]}
        </Popover>
      )}
      {disabled && <div className={classNames.overlayer} />}
    </div>
  );
}
